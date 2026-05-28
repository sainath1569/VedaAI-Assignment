import { create } from "zustand";

export interface QuestionTypeInfo {
  title: string;
  questions: number;
  marks: number;
}

export interface Assignment {
  id: string;
  title: string;
  assigned: string;
  due: string;
  fileName?: string;
  fileSize?: string;
  questionTypes: QuestionTypeInfo[];
  additionalInfo?: string;
  totalQuestions: number;
  totalMarks: number;
  schoolName: string;
  subjectName: string;
  className: string;
  timeAllowed: string;
  questionsList: string[];
  answersList: string[];
}

interface AssignmentsState {
  assignments: Assignment[];
  addAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => void;
  getAssignmentById: (id: string) => Assignment | undefined;
}

// Initial mockup assignments matching user's layout
const initialAssignments: Assignment[] = [
  {
    id: "1",
    title: "Quiz on Electricity",
    assigned: "20-06-2025",
    due: "21-06-2025",
    questionTypes: [
      { title: "Multiple Choice Questions", questions: 5, marks: 1 },
      { title: "Short Questions", questions: 5, marks: 3 }
    ],
    totalQuestions: 10,
    totalMarks: 20,
    schoolName: "Delhi Public School, Sector-4, Bokaro",
    subjectName: "Science (Electricity)",
    className: "8th",
    timeAllowed: "45 minutes",
    questionsList: [
      "[Easy] Which of the following is a good conductor of electricity? (a) Rubber, (b) Copper, (c) Plastic, (d) Wood [1 Mark]",
      "[Easy] What flows in an electric circuit to constitute current? (a) Protons, (b) Atoms, (c) Electrons, (d) Neutrons [1 Mark]",
      "[Moderate] Chemical effect of electric current is used in which process? (a) Heating, (b) Electroplating, (c) Combustion, (d) Magnetism [1 Mark]",
      "[Easy] An electrolyte conducts electricity due to the movement of: (a) Molecules, (b) Ions, (c) Atoms, (d) Electrons [1 Mark]",
      "[Moderate] Which gas is evolved at the positive electrode during the electrolysis of water? (a) Hydrogen, (b) Nitrogen, (c) Oxygen, (d) Chlorine [1 Mark]",
      "[Moderate] Define electroplating. Explain its purpose. [3 Marks]",
      "[Moderate] What is the role of a conductor in the process of electrolysis? [3 Marks]",
      "[Easy] Why does a solution of copper sulfate conduct electricity? [3 Marks]",
      "[Moderate] Describe one example of the chemical effect of electric current in daily life. [3 Marks]",
      "[Challenging] What happens at the cathode and anode during the electrolysis of water? [3 Marks]"
    ],
    answersList: [
      "Copper is a good conductor of electricity.",
      "Electrons flow in an electric circuit to constitute current.",
      "Electroplating uses the chemical effect of electric current.",
      "An electrolyte conducts electricity due to the movement of ions.",
      "Oxygen gas is evolved at the anode (positive electrode).",
      "Electroplating is depositing a thin metal layer on another surface using electricity. It is used to prevent corrosion or improve appearance.",
      "A conductor allows electric current to flow, facilitating ion movement towards electrodes during electrolysis.",
      "Copper sulfate dissociates into free Cu2+ and SO42- ions, which act as charge carriers to conduct electricity.",
      "An example is chrome plating on automobile parts to give them a shiny appearance and resist corrosion.",
      "At the cathode (negative electrode), hydrogen gas is released. At the anode (positive electrode), oxygen gas is released."
    ]
  },
  {
    id: "2",
    title: "English Comprehension",
    assigned: "22-06-2025",
    due: "25-06-2025",
    questionTypes: [
      { title: "Multiple Choice Questions", questions: 5, marks: 2 },
      { title: "Short Questions", questions: 2, marks: 5 }
    ],
    totalQuestions: 7,
    totalMarks: 20,
    schoolName: "Delhi Public School, Sector-4, Bokaro",
    subjectName: "English Literature",
    className: "5th",
    timeAllowed: "45 minutes",
    questionsList: [
      "[Easy] Who is the main protagonist of the story? [2 Marks]",
      "[Easy] Where did the characters go during the summer vacation? [2 Marks]",
      "[Moderate] What was the central conflict in the second chapter? [2 Marks]",
      "[Moderate] What does the word 'elated' mean in paragraph 3? [2 Marks]",
      "[Easy] Choose the correct antonym for 'feeble'. [2 Marks]",
      "[Challenging] Summarize the main theme of the comprehension passage in your own words. [5 Marks]",
      "[Challenging] Analyze the character growth of Sarah from the beginning to the end. [5 Marks]"
    ],
    answersList: [
      "The main protagonist is John, a young boy from the countryside.",
      "They went to their grandparents' cottage near the lake.",
      "The central conflict was the storm that threatened to destroy the local bridge.",
      "'Elated' means extremely happy or excited.",
      "The correct antonym is 'strong' or 'robust'.",
      "The main theme is the importance of family, resilience, and working together to overcome natural difficulties.",
      "Sarah starts as a timid girl scared of storms, but through taking charge of the emergency supplies, she gains courage and leadership skills."
    ]
  }
];

export const useAssignmentsStore = create<AssignmentsState>((set, get) => {
  // Try to load initial state from localStorage if available (client-side only)
  let loadedAssignments = initialAssignments;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("vedaai_assignments");
    if (saved) {
      try {
        loadedAssignments = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved assignments", e);
      }
    } else {
      localStorage.setItem("vedaai_assignments", JSON.stringify(initialAssignments));
    }
  }

  return {
    assignments: loadedAssignments,
    addAssignment: (assignment) => {
      set((state) => {
        const updated = [assignment, ...state.assignments];
        if (typeof window !== "undefined") {
          localStorage.setItem("vedaai_assignments", JSON.stringify(updated));
        }
        return { assignments: updated };
      });
    },
    deleteAssignment: async (id) => {
      try {
        await fetch(`http://localhost:3001/assignments/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete assignment from database server:", err);
      }
      set((state) => {
        const updated = state.assignments.filter((a) => a.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem("vedaai_assignments", JSON.stringify(updated));
        }
        return { assignments: updated };
      });
    },
    getAssignmentById: (id) => {
      return get().assignments.find((a) => a.id === id);
    }
  };
});
