"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Minus,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useAssignmentsStore } from "@/store/assignmentsStore";
import MicIcon from "@/assets/Mic.png";
type QuestionCounterField = "questions" | "marks";

interface QuestionTypeItem {
  id: string;
  title: string;
  questions: number;
  marks: number;
}

interface UploadedFileInfo {
  name: string;
  size: number;
}

const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True/False Questions",
  "Fill in the Blanks",
  "Long Answer Questions",
];

const INITIAL_QUESTION_TYPES: QuestionTypeItem[] = [
  { id: "mcq", title: "Multiple Choice Questions", questions: 4, marks: 1 },
  { id: "short", title: "Short Questions", questions: 3, marks: 2 },
  { id: "diagram", title: "Diagram/Graph-Based Questions", questions: 5, marks: 5 },
  { id: "numerical", title: "Numerical Problems", questions: 5, marks: 5 },
];

const GENERATION_STEPS = [
  "Connecting to WebSocket gateway...",
  "Initializing generation job in BullMQ...",
  "Analyzing uploaded text/document structure...",
  "Converting criteria to LLM prompt...",
  "Generating questions & answer keys via AI...",
  "Formatting layout & compiling assignment data...",
  "Saving assignment. WebSocket broadcast: Job Complete!",
];

function formatDateForDisplay(dateValue: string) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;
  return `${day}-${month}-${year}`;
}

function getTodayInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDisplayDate() {
  return formatDateForDisplay(getTodayInputDate());
}

function getFileSizeLabel(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function buildQuestionAndAnswerLists(title: string, questionTypes: QuestionTypeItem[]) {
  const questionsList: string[] = [];
  const answersList: string[] = [];

  questionTypes.forEach((type) => {
    for (let index = 1; index <= type.questions; index += 1) {
      const difficulty = index % 3 === 0 ? "Challenging" : index % 2 === 0 ? "Moderate" : "Easy";
      const lowerTitle = type.title.toLowerCase();

      if (lowerTitle.includes("multiple choice")) {
        questionsList.push(
          `[${difficulty}] Multiple choice question ${index} based on ${title}. Options: (a) Option A, (b) Option B, (c) Option C, (d) Option D. [${type.marks} Marks]`
        );
        answersList.push(`Option B is the correct answer for multiple choice question ${index}.`);
      } else if (lowerTitle.includes("short")) {
        questionsList.push(`[${difficulty}] Explain the key concept ${index} related to ${title}. [${type.marks} Marks]`);
        answersList.push(`The answer should briefly explain the main idea and its practical use.`);
      } else if (lowerTitle.includes("diagram") || lowerTitle.includes("graph")) {
        questionsList.push(`[${difficulty}] Draw or analyze a diagram/graph related to ${title}, point ${index}. [${type.marks} Marks]`);
        answersList.push(`The answer should identify the labelled parts and explain the relationship shown.`);
      } else if (lowerTitle.includes("numerical")) {
        questionsList.push(
          `[${difficulty}] Solve a numerical problem related to ${title}. Given Y = ${index * 10} and Z = ${type.marks * 5}, calculate X. [${type.marks} Marks]`
        );
        answersList.push(`X = (Y × Z) / 2 = ${(index * 10 * type.marks * 5) / 2}.`);
      } else {
        questionsList.push(`[${difficulty}] Answer question ${index} from ${type.title} related to ${title}. [${type.marks} Marks]`);
        answersList.push(`The answer should clearly define the concept and mention its importance.`);
      }
    }
  });

  return { questionsList, answersList };
}

export default function CreateAssignmentForm() {
  const router = useRouter();
  const { addAssignment } = useAssignmentsStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<UploadedFileInfo | null>(null);
  const [selectedFileObject, setSelectedFileObject] = useState<File | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeItem[]>(INITIAL_QUESTION_TYPES);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [openQuestionTypeId, setOpenQuestionTypeId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const recognizerRef = useRef<any>(null);

  const totalQuestions = useMemo(() => questionTypes.reduce((total, item) => total + item.questions, 0), [questionTypes]);
  const totalMarks = useMemo(() => questionTypes.reduce((total, item) => total + item.questions * item.marks, 0), [questionTypes]);

  const availableQuestionTypes = useMemo(
    () => QUESTION_TYPE_OPTIONS.filter((type) => !questionTypes.some((item) => item.title === type)),
    [questionTypes]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!addMenuRef.current?.contains(target)) setShowAddMenu(false);

      // Fix: Only close the question type dropdown if the click target is completely outside the question type row/dropdown container.
      if (target instanceof Element && !target.closest(".question-type-dropdown-container")) {
        setOpenQuestionTypeId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isGenerating || generationStep >= GENERATION_STEPS.length) return;

    const timer = window.setTimeout(() => {
      setGenerationStep((currentStep) => currentStep + 1);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [isGenerating, generationStep]);

  function handleFile(file: File) {
    setSelectedFile({ name: file.name, size: file.size });
    setSelectedFileObject(file);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function updateQuestionTypeCount(id: string, field: QuestionCounterField, delta: number) {
    setQuestionTypes((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, [field]: Math.max(1, item[field] + delta) } : item))
    );
  }

  function deleteQuestionType(id: string) {
    setQuestionTypes((currentItems) => currentItems.filter((item) => item.id !== id));
    setOpenQuestionTypeId(null);
  }

  function updateQuestionTypeTitle(id: string, title: string) {
    setQuestionTypes((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, title } : item))
    );
    setOpenQuestionTypeId(null);
  }

  function addQuestionType(title: string) {
    setQuestionTypes((currentItems) => [
      ...currentItems,
      {
        id: `${Date.now()}-${title}`,
        title,
        questions: 5,
        marks: 2,
      },
    ]);
    setShowAddMenu(false);
  }

  function getGeneratedTitle() {
    const rawTitle = selectedFile
      ? selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      : description.trim()
        ? `Quiz: ${description.trim().slice(0, 28)}`
        : "Quiz on general topics";

    return rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  }

  async function handleGenerate() {
    if (!selectedFileObject) {
      setValidationError("Please upload a PDF file to generate the assignment.");
      return;
    }

    if (selectedFileObject.type !== "application/pdf" && !selectedFileObject.name.toLowerCase().endsWith(".pdf")) {
      setValidationError("Please upload a valid PDF file. Other file types are not supported.");
      return;
    }

    if (!dueDate) {
      setValidationError("Please select a due date for the assignment.");
      return;
    }

    if (questionTypes.length === 0) {
      setValidationError("Please add at least one question type.");
      return;
    }

    setValidationError("");
    setIsGenerating(true);
    setGenerationStep(0);

    const generatedTitle = getGeneratedTitle();

    const prompt = `Generate an assignment with ${totalQuestions} questions totaling ${totalMarks} marks. Description: ${description.trim() || "No extra instructions provided."}`;

    const defaultSchoolName = typeof window !== "undefined" ? localStorage.getItem("vedaai_default_schoolName") || "Delhi Public School, Sector-4, Bokaro" : "Delhi Public School, Sector-4, Bokaro";
    const defaultSubjectName = typeof window !== "undefined" ? localStorage.getItem("vedaai_default_subjectName") || "Science" : "Science";
    const defaultClassName = typeof window !== "undefined" ? localStorage.getItem("vedaai_default_className") || "8th" : "8th";

    const formData = new FormData();
    formData.append("file", selectedFileObject);
    formData.append("prompt", prompt);
    formData.append("title", generatedTitle);
    formData.append("description", description.trim());
    formData.append("additionalInfo", description.trim());
    formData.append("dueDate", dueDate);
    formData.append("questionTypes", JSON.stringify(questionTypes.map(({ title, questions, marks }) => ({ title, questions, marks }))));
    formData.append("totalQuestions", String(totalQuestions));
    formData.append("totalMarks", String(totalMarks));
    formData.append("schoolName", defaultSchoolName);
    formData.append("subjectName", defaultSubjectName);
    formData.append("className", defaultClassName);
    formData.append("username", "saina");

    try {
      console.log("LIVE API CALL STARTED");
      console.log("Backend URL:", "https://veda-backend-hubf.onrender.com/assignments");
      console.log("FormData:", [...formData.entries()]);
      const response = await fetch("https://veda-backend-hubf.onrender.com/assignments", {
        method: "POST",
        body: formData, // Browser automatically generates boundary for FormData
      });
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json().catch(() => null);
      console.log("Raw response data:", data);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate assignment. Please try again.");
      }

      const assignmentFromServer = data?.assignment;
      if (!assignmentFromServer) {
        throw new Error("Did not receive a valid generated assignment from the server.");
      }

      if (assignmentFromServer.schoolName && typeof window !== "undefined") {
        localStorage.setItem("vedaai_default_schoolName", assignmentFromServer.schoolName);
      }
      if (assignmentFromServer.subjectName && typeof window !== "undefined") {
        localStorage.setItem("vedaai_default_subjectName", assignmentFromServer.subjectName);
      }
      if (assignmentFromServer.className && typeof window !== "undefined") {
        localStorage.setItem("vedaai_default_className", assignmentFromServer.className);
      }

      const finalAssignment = {
        ...assignmentFromServer,
        id: assignmentFromServer.id || assignmentFromServer._id || Date.now().toString(),
        assigned: assignmentFromServer.assigned || getTodayDisplayDate(),
        due: assignmentFromServer.due || formatDateForDisplay(dueDate),
      };

      console.log("Frontend received assignment:", finalAssignment);
      addAssignment(finalAssignment);
      setGenerationStep(GENERATION_STEPS.length);

      // Brief delay to let the user see the 100% success progress bar before navigating
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/");
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Something went wrong.");
      setIsGenerating(false);
    }
  }

  return (
    <div className="font-bricolage mx-auto flex w-full max-w-[373px] flex-col items-center gap-6 px-3 pb-32 lg:max-w-[1103px] lg:gap-8 lg:px-0 pb-24 lg:pb-0">
      {isGenerating && <GenerationOverlay generationStep={generationStep} />}

      <MobileHeader onBack={() => router.push("/")} />
      <DesktopHeader />

      {validationError && (
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[14px] font-medium text-red-700">
          {validationError}
        </div>
      )}

      <section className="flex w-[349px] flex-col items-start gap-6 rounded-[32px] bg-white/50 px-4 py-8 lg:w-[810px] lg:gap-8 lg:p-8">
        <div className="flex h-[50px] flex-col items-start justify-center gap-0.5">
          <h2 className="text-[20px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
            Assignment Details
          </h2>
          <p className="text-[14px] font-normal leading-[140%] tracking-[-0.04em] text-[rgba(94,94,94,0.8)]">
            Basic information about your assignment
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-4">
          <FileUploadBox
            selectedFile={selectedFile}
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onRemoveFile={() => {
              setSelectedFile(null);
              setSelectedFileObject(null);
            }}
          />

          <p className="w-full text-center text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[rgba(48,48,48,0.6)]">
            Upload images of your preferred document/image
          </p>

          <div className="flex w-full flex-col items-start gap-2">
            <label htmlFor="dueDate" className="text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
              Due Date
            </label>

            <input
              id="dueDate"
              type="date"
              min={getTodayInputDate()}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={`h-11 w-full rounded-full border-[1.25px] border-[#DADADA] bg-transparent px-4 text-[16px] font-medium leading-[140%] tracking-[-0.04em] outline-none ${dueDate ? "text-[#303030]" : "text-[#A9A9A9]"
                }`}
            />
          </div>

          <div className="flex w-full flex-col items-end gap-4">
            <div className="flex w-full flex-col items-start gap-4 lg:flex-row lg:justify-between lg:gap-16">
              <div className="flex w-full flex-col items-start gap-4 lg:w-[471px]">
                <h3 className="text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
                  Question Type
                </h3>

                <div className="flex w-full flex-col gap-3 lg:gap-4">
                  {questionTypes.map((item) => (
                    <QuestionRow
                      key={item.id}
                      item={item}
                      options={QUESTION_TYPE_OPTIONS.filter(
                        (type) =>
                          type === item.title ||
                          !questionTypes.some((questionType) => questionType.title === type)
                      )}
                      isOpen={openQuestionTypeId === item.id}
                      onToggle={(event) => {
                        event.stopPropagation();
                        setShowAddMenu(false);
                        setOpenQuestionTypeId((currentId) => (currentId === item.id ? null : item.id));
                      }}
                      onChangeTitle={(title) => updateQuestionTypeTitle(item.id, title)}
                      onIncrementQuestions={() => updateQuestionTypeCount(item.id, "questions", 1)}
                      onDecrementQuestions={() => updateQuestionTypeCount(item.id, "questions", -1)}
                      onIncrementMarks={() => updateQuestionTypeCount(item.id, "marks", 1)}
                      onDecrementMarks={() => updateQuestionTypeCount(item.id, "marks", -1)}
                      onDelete={() => deleteQuestionType(item.id)}
                    />
                  ))}
                </div>

                <div ref={addMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddMenu((value) => !value)}
                    className="flex h-9 items-center gap-2"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B2B2B] text-white">
                      <Plus size={20} />
                    </span>
                    <span className="text-[14px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
                      Add Question Type
                    </span>
                  </button>

                  {showAddMenu && (
                    <div className="absolute left-0 z-30 mt-3 flex w-[280px] flex-col rounded-2xl bg-white p-3 shadow-2xl">
                      {availableQuestionTypes.length > 0 ? (
                        availableQuestionTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addQuestionType(type)}
                            className="rounded-xl px-3 py-2 text-left text-[14px] font-medium text-[#303030] hover:bg-[#F6F6F6]"
                          >
                            {type}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-3 text-center text-sm italic text-gray-400">All standard types added.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden w-[275px] justify-end gap-4 lg:flex">
                <DesktopCounterColumn
                  title="No. of Questions"
                  items={questionTypes}
                  field="questions"
                  onIncrement={(id) => updateQuestionTypeCount(id, "questions", 1)}
                  onDecrement={(id) => updateQuestionTypeCount(id, "questions", -1)}
                />
                <DesktopCounterColumn
                  title="Marks"
                  items={questionTypes}
                  field="marks"
                  onIncrement={(id) => updateQuestionTypeCount(id, "marks", 1)}
                  onDecrement={(id) => updateQuestionTypeCount(id, "marks", -1)}
                />
              </div>
            </div>

            <div className="flex w-[150px] flex-col items-start gap-2">
              <p className="text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
                Total Questions : {totalQuestions}
              </p>
              <p className="text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
                Total Marks : {totalMarks}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2">
            <label
              htmlFor="description"
              className="text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]"
            >
              Additional Information(For Better Output)
            </label>

            <div className="relative flex h-[100px] w-full rounded-[24px] border border-dashed border-[#DADADA] bg-[#F6F6F6] px-4 py-4 lg:h-[104px] lg:w-[746px] lg:rounded-[20px]">
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                className="h-full w-full resize-none bg-transparent pr-12 text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030] outline-none placeholder:text-[rgba(48,48,48,0.6)]"
              />

              <button
                type="button"
                onClick={() => {
                  if (!micActive) {
                    const SpeechRecognition =
                      (window as any).SpeechRecognition ||
                      (window as any).webkitSpeechRecognition;
                    if (!SpeechRecognition) {
                      alert("Speech recognition not supported in this browser.");
                      return;
                    }
                    const recognizer = new SpeechRecognition();
                    recognizer.lang = "en-US";
                    recognizer.continuous = true;
                    recognizer.interimResults = false;
                    recognizer.onresult = (event: any) => {
                      let transcript = "";
                      for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                          transcript += event.results[i][0].transcript;
                        }
                      }
                      if (transcript) {
                        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
                      }
                    };
                    recognizer.onend = () => {
                      setMicActive(false);
                    };
                    recognizer.start();
                    recognizerRef.current = recognizer;
                    setMicActive(true);
                  } else {
                    recognizerRef.current?.abort();
                    recognizerRef.current = null;
                    setMicActive(false);
                  }
                }}
                disabled={false}
                className={`absolute bottom-4 right-4 flex h-[36px] w-[36px] items-center justify-center rounded-[18px] ${micActive ? "bg-[#F0F0F0]" : "bg-[#FFFFFF]"}`}
              >
                <img src={MicIcon.src} alt="mic" className="h-[16px] w-[16px] object-contain drop-shadow-[0_11px_33px_rgba(0,0,0,0.12)]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex h-[46px] w-[349px] items-center justify-between gap-11 lg:w-[810px]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-[46px] w-[134px] items-center justify-center gap-1 rounded-full bg-white px-6 text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]"
        >
          <ArrowLeft size={20} />
          Previous
        </button>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={micActive}
          className="flex h-[46px] w-[106px] items-center justify-center gap-1 rounded-full bg-[#181818] px-6 text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-white"
        >
          Next
          <ArrowLeft size={20} className="rotate-180" />
        </button>
      </div>
    </div>
  );
}

function MobileHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="font-bricolage flex w-[349px] flex-col items-center gap-6 lg:hidden">
      <div className="flex h-12 w-full items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 backdrop-blur-[12px]"
        >
          <ArrowLeft size={24} strokeWidth={2.5} className="text-[#303030]" />
        </button>

        <h1 className="text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
          Create Assignment
        </h1>

        <div className="h-12 w-12" />
      </div>

      <div className="flex w-full gap-3">
        <div className="h-0 flex-1 border-[5px] border-[#5E5E5E] rounded-[8px]" />
        <div className="h-0 flex-1 border-[5px] border-[#DADADA] rounded-[8px]" />
      </div>
    </div>
  );
}

function DesktopHeader() {
  return (
    <div className="font-bricolage hidden w-[1103px] flex-col gap-8 lg:flex">
      <div className="flex h-[66px] w-full items-center gap-4 p-2">
        <div className="flex h-[50px] items-center gap-[14px]">
          <div className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#CFEED8]">
            <div className="h-[12px] w-[12px] rounded-full bg-[#4BC26D]" />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-[20px] font-bold leading-[120%] tracking-[-0.05em] text-[#303030]">
              Create Assignment
            </h1>

            <p className="mt-[2px] text-[14px] font-normal leading-[135%] tracking-[-0.03em] text-[rgba(94,94,94,0.72)]">
              Set up a new assignment for your students
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-[815px] gap-3">
        <div className="h-0 flex-1 border-[5px] border-[#5E5E5E] rounded-[8px]" />
        <div className="h-0 flex-1 border-[5px] border-[#DADADA] rounded-[8px]" />
      </div>
    </div>
  );
}

function FileUploadBox({
  selectedFile,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemoveFile,
}: {
  selectedFile: UploadedFileInfo | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`font-bricolage flex h-[202px] w-full flex-col items-center justify-center gap-4 rounded-[24px] border-[1.75px] border-dashed px-8 py-6 text-center transition-all lg:w-[746px] ${isDragging ? "border-[#303030] bg-white" : "border-black/20 bg-[#F6F6F6] lg:bg-white"
        }`}
    >
      {selectedFile ? (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <FileText size={24} className="text-[#1E1E1E]" />
          </div>

          <div className="flex w-full flex-col items-center gap-1">
            <p className="max-w-full break-words text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">
              {selectedFile.name}
            </p>
            <p className="text-[14px] font-normal leading-[140%] tracking-[-0.04em] text-[#A9A9A9]">
              {getFileSizeLabel(selectedFile.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={onRemoveFile}
            className="flex h-9 w-[127px] items-center justify-center rounded-full bg-white text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030] lg:bg-[#F6F6F6]"
          >
            Remove
          </button>
        </>
      ) : (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <Upload size={24} strokeWidth={2.5} className="text-[#1E1E1E]" />
          </div>

          <div className="flex w-full flex-col items-center gap-1 lg:w-[682px]">
            <p className="text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">
              Choose a file or drag & drop it here
            </p>
            <p className="text-[14px] font-normal leading-[140%] tracking-[-0.04em] text-[#A9A9A9]">
              JPEG, PNG, upto 10MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={onFileSelect}
            className="hidden"
            accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-[127px] items-center justify-center rounded-full bg-white text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030] lg:bg-[#F6F6F6]"
          >
            Browse File
          </button>
        </>
      )}
    </div>
  );
}

function QuestionRow({
  item,
  options,
  isOpen,
  onToggle,
  onChangeTitle,
  onIncrementQuestions,
  onDecrementQuestions,
  onIncrementMarks,
  onDecrementMarks,
  onDelete,
}: {
  item: QuestionTypeItem;
  options: string[];
  isOpen: boolean;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onChangeTitle: (title: string) => void;
  onIncrementQuestions: () => void;
  onDecrementQuestions: () => void;
  onIncrementMarks: () => void;
  onDecrementMarks: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="question-type-dropdown-container relative hidden h-11 w-[471px] items-center gap-3 lg:flex">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-11 w-[443px] items-center justify-between rounded-full bg-white px-4"
        >
          <span className="truncate text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">
            {item.title}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={`shrink-0 text-[#303030] transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <button type="button" onClick={onDelete} aria-label={`Remove ${item.title}`}>
          <X size={16} strokeWidth={1.5} className="text-[#303030]" />
        </button>

        {isOpen && (
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="absolute left-0 top-[52px] z-40 flex w-[443px] flex-col rounded-2xl bg-white p-2 shadow-2xl"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChangeTitle(option)}
                className={`rounded-xl px-3 py-2 text-left text-[14px] font-medium leading-[140%] tracking-[-0.04em] ${option === item.title ? "bg-[#F0F0F0] text-[#303030]" : "text-[#303030] hover:bg-[#F6F6F6]"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="question-type-dropdown-container relative flex w-full flex-col items-end gap-3 rounded-[24px] bg-white p-3 lg:hidden">
        <div className="flex h-5 w-full items-center justify-between gap-3">
          <button type="button" onClick={onToggle} className="flex min-w-0 items-center gap-6">
            <span className="truncate text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">
              {item.title}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={1.5}
              className={`shrink-0 text-[#303030] transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          <button type="button" onClick={onDelete} aria-label={`Remove ${item.title}`}>
            <X size={16} strokeWidth={1.5} className="text-[#303030]" />
          </button>
        </div>

        {isOpen && (
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="absolute left-3 right-3 top-[44px] z-40 flex flex-col rounded-2xl bg-white p-2 shadow-2xl"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChangeTitle(option)}
                className={`rounded-xl px-3 py-2 text-left text-[14px] font-medium leading-[140%] tracking-[-0.04em] ${option === item.title ? "bg-[#F0F0F0] text-[#303030]" : "text-[#303030] hover:bg-[#F6F6F6]"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <div className="flex h-[82px] w-full items-start gap-3 rounded-[24px] bg-[#F0F0F0] p-2">
          <MobileCounterBlock title="No. of Questions" value={item.questions} onIncrement={onIncrementQuestions} onDecrement={onDecrementQuestions} />
          <MobileCounterBlock title="Marks" value={item.marks} onIncrement={onIncrementMarks} onDecrement={onDecrementMarks} />
        </div>
      </div>
    </>
  );
}

function DesktopCounterColumn({
  title,
  items,
  field,
  onIncrement,
  onDecrement,
}: {
  title: string;
  items: QuestionTypeItem[];
  field: QuestionCounterField;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}) {
  return (
    <div className="flex w-[116px] flex-col items-center gap-4">
      <p className="text-center text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">{title}</p>

      {items.map((item) => (
        <Counter
          key={`${item.id}-${field}`}
          value={item[field]}
          onIncrement={() => onIncrement(item.id)}
          onDecrement={() => onDecrement(item.id)}
          className="h-11 w-[100px]"
        />
      ))}
    </div>
  );
}

function MobileCounterBlock({
  title,
  value,
  onIncrement,
  onDecrement,
}: {
  title: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex h-[66px] flex-1 flex-col items-center gap-2">
      <p className="text-center text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">{title}</p>
      <Counter value={value} onIncrement={onIncrement} onDecrement={onDecrement} className="h-[38px] w-full" />
    </div>
  );
}

function Counter({
  value,
  onIncrement,
  onDecrement,
  className = "",
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-full bg-white px-2 ${className}`}>
      <button type="button" onClick={() => value > 1 && onDecrement()} disabled={value <= 1}>
        <Minus size={16} className="text-[#5E5E5E]" />
      </button>

      <span className="text-[16px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030]">{value}</span>

      <button type="button" onClick={onIncrement}>
        <Plus size={16} className="text-[#5E5E5E]" />
      </button>
    </div>
  );
}

function GenerationOverlay({ generationStep }: { generationStep: number }) {
  return (
    <div className="font-bricolage fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-none lg:backdrop-blur-sm">
      <div className="w-full max-w-[620px] rounded-[30px] border border-white/10 bg-[#252525] p-5 pb-8 text-white shadow-2xl sm:rounded-[34px] sm:p-8">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 shrink-0 animate-spin text-[#ff5a1f]" />
          <div>
            <h3 className="text-xl font-bold">Generating Assessment</h3>
            <p className="mt-0.5 text-sm text-gray-400">Real-time WebSocket & job queue progress</p>
          </div>
        </div>

        <div className="mt-8 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff7c50] to-[#ff5a1f] transition-all duration-500"
            style={{ width: `${(generationStep / GENERATION_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="mt-8 space-y-3.5">
          {GENERATION_STEPS.map((step, index) => {
            const isCompleted = generationStep > index;
            const isCurrent = generationStep === index;

            return (
              <div
                key={step}
                className={`flex items-center gap-3.5 text-[14px] transition-opacity duration-300 sm:text-[15px] ${isCompleted ? "text-[#58d07c]" : isCurrent ? "font-medium text-white" : "text-gray-400 opacity-45"
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={19} className="shrink-0 text-[#58d07c]" />
                ) : isCurrent ? (
                  <Loader2 size={19} className="shrink-0 animate-spin text-[#ff5a1f]" />
                ) : (
                  <div className="h-[19px] w-[19px] shrink-0 rounded-full border-2 border-white/20" />
                )}

                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
