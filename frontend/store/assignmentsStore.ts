import { create } from "zustand";

const API_URL = "https://veda-backend-hubf.onrender.com";

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
  isLoading: boolean;
  loadAssignments: () => Promise<void>;
  addAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => Promise<void>;
  getAssignmentById: (id: string) => Assignment | undefined;
}

const initialAssignments: Assignment[] = [];

function normalizeAssignment(item: any): Assignment {
  return {
    ...item,
    id: item.id || item._id?.toString() || Date.now().toString(),
    title: item.title || "Untitled Assignment",
    assigned:
      item.assigned ||
      (item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-") : ""),
    due: item.due || item.dueDate || "",
    questionTypes: item.questionTypes || [],
    totalQuestions: item.totalQuestions || item.questionsList?.length || 0,
    totalMarks: item.totalMarks || 0,
    schoolName: item.schoolName || "DPS Bokaro",
    subjectName: item.subjectName || "Grounded Topic",
    className: item.className || "8th",
    timeAllowed: item.timeAllowed || "45 minutes",
    questionsList: item.questionsList || [],
    answersList: item.answersList || [],
  };
}

export const useAssignmentsStore = create<AssignmentsState>((set, get) => {
  let loadedAssignments = initialAssignments;

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("vedaai_assignments");

    if (saved) {
      try {
        loadedAssignments = JSON.parse(saved);
      } catch (error) {
        console.error("Failed to parse saved assignments", error);
      }
    }
  }

  return {
    assignments: loadedAssignments,
    isLoading: false,

    loadAssignments: async () => {
      try {
        set({ isLoading: true });

        const response = await fetch(`${API_URL}/assignments`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }

        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map(normalizeAssignment).reverse()
          : [];

        set({ assignments: normalized });

        if (typeof window !== "undefined") {
          localStorage.setItem("vedaai_assignments", JSON.stringify(normalized));
        }
      } catch (error) {
        console.error("Failed to load assignments:", error);
      } finally {
        set({ isLoading: false });
      }
    },

    addAssignment: (assignment) => {
      const normalized = normalizeAssignment(assignment);

      set((state) => {
        const updated = [normalized, ...state.assignments];

        if (typeof window !== "undefined") {
          localStorage.setItem("vedaai_assignments", JSON.stringify(updated));
        }

        return { assignments: updated };
      });
    },

    deleteAssignment: async (id) => {
      try {
        await fetch(`${API_URL}/assignments/${id}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete assignment from backend:", error);
      }

      set((state) => {
        const updated = state.assignments.filter((assignment) => assignment.id !== id);

        if (typeof window !== "undefined") {
          localStorage.setItem("vedaai_assignments", JSON.stringify(updated));
        }

        return { assignments: updated };
      });
    },

    getAssignmentById: (id) => {
      return get().assignments.find((assignment) => assignment.id === id);
    },
  };
});