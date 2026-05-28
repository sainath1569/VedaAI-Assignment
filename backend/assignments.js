// assignments.js – routes for assignment creation and retrieval
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { connect, validateAssignment } = require('./db');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// Helper: call Groq LLM to generate assignment JSON from a prompt
async function generateAssignmentFromPrompt(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // high-quality Meta model on Groq
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Lower temperature to ensure strict grounding
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  // Expect the LLM to return a JSON string representing the assignment
  return data.choices[0].message.content;
}

// Helper: build programmatic fallback questions and answers if LLM fails or returns empty lists
function buildFallbackQuestionAndAnswerLists(title, questionTypes) {
  const questionsList = [];
  const answersList = [];

  if (!Array.isArray(questionTypes)) return { questionsList, answersList };

  questionTypes.forEach((type) => {
    for (let index = 1; index <= type.questions; index += 1) {
      const difficulty = index % 3 === 0 ? 'Challenging' : index % 2 === 0 ? 'Moderate' : 'Easy';
      const lowerTitle = (type.title || '').toLowerCase();

      if (lowerTitle.includes('multiple choice')) {
        // Provide exactly four options labeled (A), (B), (C), (D)
        questionsList.push(
          `[${difficulty}] Multiple choice question ${index} based on ${title}. Options: (A) Option A, (B) Option B, (C) Option C, (D) Option D. [${type.marks} Marks]`
        );
        // Include the correct answer label in the answers list
        answersList.push(`(B) is the correct answer for multiple choice question ${index}.`);
      } else if (lowerTitle.includes('short')) {
        questionsList.push(
          `[${difficulty}] Explain the key concept ${index} related to ${title}. [${type.marks} Marks]`
        );
        answersList.push(`The answer should briefly explain the main idea and its practical use.`);
      } else if (lowerTitle.includes('diagram') || lowerTitle.includes('graph')) {
        questionsList.push(
          `[${difficulty}] Draw or analyze a diagram/graph related to ${title}, point ${index}. [${type.marks} Marks]`
        );
        answersList.push(`The answer should identify the labelled parts and explain the relationship shown.`);
      } else if (lowerTitle.includes('numerical')) {
        questionsList.push(
          `[${difficulty}] Solve a numerical problem related to ${title}. Given Y = ${index * 10} and Z = ${type.marks * 5}, calculate X. [${type.marks} Marks]`
        );
        answersList.push(`X = (Y × Z) / 2 = ${(index * 10 * type.marks * 5) / 2}.`);
      } else {
        questionsList.push(
          `[${difficulty}] Answer question ${index} from ${type.title} related to ${title}. [${type.marks} Marks]`
        );
        answersList.push(`The answer should clearly define the concept and mention its importance.`);
      }
    }
  });

  return { questionsList, answersList };
}

// POST /assignments – generate assignment via LLM, validate, store in MongoDB
router.post('/assignments', upload.single('file'), async (req, res) => {
  try {
    let {
      prompt,
      additionalInfo,
      questionTypes,
      dueDate,
      fileName,
      fileSize,
      totalQuestions,
      totalMarks,
      schoolName,
      subjectName,
      className,
    } = req.body;

    // Parse questionTypes if it is sent as a stringified JSON (from multipart/form-data)
    if (typeof questionTypes === 'string') {
      try {
        questionTypes = JSON.parse(questionTypes);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid questionTypes JSON format.' });
      }
    }

    // Convert totalQuestions and totalMarks to numbers if they are strings
    totalQuestions = Number(totalQuestions) || 0;
    totalMarks = Number(totalMarks) || 0;

    // Validation: PDF file must be uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file to generate the assignment.' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Unsupported file format. Only PDF files are supported.' });
    }

    // Extract text using pdf-parse library
    let pdfText = '';
    try {
const data = await (pdfParse.default || pdfParse)(req.file.buffer);
      pdfText = data.text ? data.text.trim() : '';
    } catch (parseErr) {
      console.error('pdf-parse failed:', parseErr);
      return res.status(400).json({ error: 'Failed to extract text from the uploaded PDF. Please make sure the file is not corrupted.' });
    }

    if (!pdfText) {
      return res.status(422).json({ error: 'The uploaded PDF is empty or does not contain any readable text.' });
    }

    // Enforce prompt instructions for strict grounding in the PDF content
    let fullPrompt = `You are a professional assignment and assessment generator.
Your job is to generate a structured assignment strictly and ONLY from the provided PDF content.

CRITICAL INSTRUCTIONS:
1. Grounding: You must generate questions and answers based ONLY on the provided PDF content. Do NOT use external facts, general knowledge, or hallucinated facts.
2. Sufficiency: If the PDF content does not contain enough information to generate the requested questions or to find their answers, do NOT make up questions. Instead, return an empty questionsList and set the title to "Insufficient Content".
3. Formatting: Return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks like \`\`\`json. Do not include any introductory or concluding text.
4. Multiple Choice:
   - For each multiple choice question, the four options MUST be included inside the same question string in questionsList.
   - Format: "[Easy] Question text? (A) option one (B) option two (C) option three (D) option four [1 Marks]"
   - Do NOT put options inside answersList.
   - answersList should contain only the correct answer, for example: "1. Correct answer: (B) option two"
JSON Structure:
{
  "title": "string",
  "questionsList": [
    "[Easy] MCQ question text? (A) option one (B) option two (C) option three (D) option four [1 Marks]"
  ],
  "answersList": [
    "Correct answer: (B) option two"
  ],
  "timeAllowed": "string"
}

Requested Question Types to include:
${JSON.stringify(questionTypes || [])}

Target Counts:
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}

Additional Instructions: ${additionalInfo || prompt || "None"}

PROVIDED PDF CONTENT:
--- START PDF CONTENT ---
${pdfText}
--- END PDF CONTENT ---
`;

    // Call the LLM
    const llmOutput = await generateAssignmentFromPrompt(fullPrompt);

    console.log('--- Raw LLM response ---');
    console.log(llmOutput);
    console.log('------------------------');

    let parsedJson;
    let jsonString = '';
    const jsonFenceMatch = llmOutput.match(/```json\s*([\s\S]*?)```/i);
    if (jsonFenceMatch) {
      jsonString = jsonFenceMatch[1];
    } else {
      const genericFenceMatch = llmOutput.match(/```\s*([\s\S]*?)```/);
      if (genericFenceMatch) {
        jsonString = genericFenceMatch[1];
      } else {
        const jsonObjectMatch = llmOutput.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        } else {
          jsonString = llmOutput;
        }
      }
    }
    jsonString = jsonString.trim();

    try {
      parsedJson = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('Failed to parse LLM response as JSON:', parseErr);
      return res.status(502).json({ error: 'The AI model generated a response that could not be parsed. Please try again.' });
    }

    console.log('--- Extracted JSON ---');
    console.log(JSON.stringify(parsedJson, null, 2));
    console.log('----------------------');

    // Check if the AI indicated the PDF had insufficient content
    if (
      parsedJson.title === 'Insufficient Content' ||
      !parsedJson.questionsList ||
      parsedJson.questionsList.length === 0
    ) {
      return res.status(422).json({
        error: 'The provided PDF content is insufficient to generate questions based on the requested criteria. Please upload a more comprehensive PDF or adjust your question type settings.'
      });
    }

    // Build the final assignment object matching expected schema
    const assignment = {
      title: parsedJson.title || req.body.title || 'Grounded Assessment',
      dueDate: dueDate || '',
      due: dueDate || '', // map due to dueDate
      description: req.body.description || additionalInfo || '',
      additionalInfo: additionalInfo || req.body.description || '',
      questionTypes: questionTypes || [],
      questionsList: parsedJson.questionsList || [],
answersList: (parsedJson.answersList || []).map((answer) =>
  answer.replace(/^\d+\.\s*/, '').trim(),
),      totalQuestions: parsedJson.questionsList.length || totalQuestions,
      // Calculate marks based on generated questions if possible, or fallback
      totalMarks: totalMarks || (parsedJson.questionsList.length * 2),
      timeAllowed: parsedJson.timeAllowed || `${(parsedJson.questionsList.length || 10) * 3} minutes`,
      questions: [], // clear questions array so it passes db.js validation
      schoolName: schoolName || 'DPS Bokaro',
      subjectName: subjectName || 'Grounded Topic',
      className: className || '8th',
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
    };

    // Save to database
    if (!validateAssignment(assignment)) {
      return res.status(400).json({ error: 'Generated assignment does not match required database schema.' });
    }

    assignment.createdAt = new Date();
    const collection = await connect();
    const result = await collection.insertOne(assignment);

    const saved = {
      ...assignment,
      _id: result.insertedId,
      id: result.insertedId.toString(),
    };

    console.log('--- Saved assignment ---');
    console.log(JSON.stringify(saved, null, 2));
    console.log('------------------------');

    res.status(201).json({ message: 'Assignment successfully generated and stored', assignment: saved });
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ error: err.message || 'An internal error occurred during assignment generation.' });
  }
});

// GET /assignments – retrieve all stored assignments
router.get('/assignments', async (req, res) => {
  try {
    const collection = await connect();
    const assignments = await collection.find({}).toArray();
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// DELETE /assignments/:id – delete a stored assignment by ID
const { ObjectId } = require('mongodb');
router.delete('/assignments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Check if the id is a valid 24-character hex string for ObjectId
    if (!ObjectId.isValid(id)) {
      // If it's a mock local assignment, just return success
      return res.json({ message: 'Mock assignment successfully deleted' });
    }
    const collection = await connect();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ message: 'Assignment successfully deleted' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
