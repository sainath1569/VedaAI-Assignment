"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAssignmentsStore } from "@/store/assignmentsStore";
import { Download } from "lucide-react";

const defaultQuestions = [
  "[Easy] Define electroplating. Explain its purpose. [2 Marks]",
  "[Moderate] What is the role of a conductor in the process of electrolysis? [2 Marks]",
  "[Easy] Why does a solution of copper sulfate conduct electricity? [2 Marks]",
  "[Moderate] Describe one example of the chemical effect of electric current in daily life. [2 Marks]",
  "[Moderate] Explain why electric current is said to have chemical effects. [2 Marks]",
  "[Challenging] How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved. [2 Marks]",
  "[Challenging] What happens at the cathode and anode during the electrolysis of water? Name the gases evolved. [2 Marks]",
  "[Easy] Mention the type of current used in electroplating and justify why it is used. [2 Marks]",
  "[Moderate] What is the importance of electric current in the field of metallurgy? [2 Marks]",
  "[Challenging] Explain with a chemical equation how copper is deposited during the electroplating of an object. [2 Marks]",
];

const defaultAnswers = [
  "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness.",
  "A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes.",
  "Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity.",
  "An example is the electroplating of silver on jewelry to prevent tarnishing.",
  "Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects.",
  "Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons: 2H2O + 2e- → H2 + 2OH-",
  "At the cathode, water is reduced to hydrogen gas and hydroxide ions. At the anode, water is oxidized to oxygen gas and hydrogen ions.",
];

function QuestionPaperContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { getAssignmentById } = useAssignmentsStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const assignment = id ? getAssignmentById(id) : undefined;

  const title = assignment ? assignment.title : "Quiz on Electricity";
  const schoolName = assignment
    ? assignment.schoolName
    : "Delhi Public School, Sector-4, Bokaro";

  const subjectName = assignment
    ? assignment.subjectName
    : "Science (Electricity)";

  const className = assignment ? assignment.className : "8th";
  const timeAllowed = assignment
    ? assignment.timeAllowed
    : "45 minutes";

  const totalMarks = assignment
    ? assignment.totalMarks
    : 20;

  const questions =
    assignment?.questionsList?.length
      ? assignment.questionsList
      : defaultQuestions;

  const answers =
    assignment?.answersList?.length
      ? assignment.answersList
      : defaultAnswers;

  const handlePrint = () => {
    window.print();
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-[34px] bg-[#d3d3d3] p-8 text-center font-semibold text-gray-500 lg:bg-[#efefef]">
        Loading Question Paper...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[373px] rounded-[40px] bg-white p-[9px] pb-[40px] font-bricolage lg:max-w-[1100px] lg:rounded-[32px] lg:bg-[#5E5E5E] lg:p-[20px]">
      <style>{`
        @media print {
          aside,
          header,
          nav,
          .no-print,
          button,
          .mobile-nav-bar {
            display: none !important;
          }

          body,
          html,
          main,
          section {
            background: white !important;
          }

          .print-sheet {
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            color: black !important;
          }

          .print-sheet p,
          .print-sheet li {
            font-size: 12pt !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>

      {/* Top black card */}
      <div className="no-print flex min-h-[147px] w-full flex-col items-start justify-center gap-[12px] rounded-[32px] bg-[#303030] px-[16px] py-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_32px_48px_rgba(0,0,0,0.2)] lg:min-h-[164px] lg:bg-[rgba(24,24,24,0.8)] lg:px-[32px] lg:py-[24px]">
        <div className="flex w-full flex-col gap-[16px]">
          <h2 className="text-[14px] font-bold leading-[17px] tracking-[-0.04em] text-[#F0F0F0] lg:text-[20px] lg:leading-[140%] lg:text-white">
            Certainly, Lakshya! Here is the customized Question Paper on the
            topic: "{title}"
          </h2>

          <button
            type="button"
            onClick={handlePrint}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#F6F6F6]/10 lg:h-[44px] lg:w-[200px] lg:gap-[4px] lg:rounded-full lg:bg-white lg:px-[24px]"
          >
            <Download
              size={20}
              className="text-white lg:h-[24px] lg:w-[24px] lg:text-[#303030]"
            />

            <span className="hidden text-[16px] font-medium leading-[22px] tracking-[-0.04em] text-[#303030] lg:block">
              Download as PDF
            </span>
          </button>
        </div>
      </div>

      {/* Paper */}
      <div className="print-sheet mt-[10px] flex w-full flex-col items-center gap-[24px] rounded-[32px] bg-[#F6F6F6] px-[16px] py-[24px] font-sans text-[#303030] lg:mt-[12px] lg:bg-white lg:p-[32px]">
        {/* Header */}
        <div className="w-full text-center">
          <h1 className="text-[20px] font-bold leading-[130%] tracking-[-0.04em] text-[#303030] lg:text-[32px] lg:leading-[160%]">
            {schoolName}
          </h1>

          <h2 className="mt-[2px] text-[20px] font-bold leading-[130%] tracking-[-0.04em] text-[#303030] lg:text-[32px] lg:leading-[160%]">
            Subject: {subjectName}
          </h2>

          <h3 className="text-[20px] font-bold leading-[130%] tracking-[-0.04em] text-[#303030] lg:text-[32px] lg:leading-[160%]">
            Class: {className}
          </h3>
        </div>

        {/* Info row */}
        <div className="flex w-full flex-col items-start gap-[10px] text-[14px] font-semibold leading-[160%] tracking-[-0.04em] text-[#303030] lg:flex-row lg:justify-between lg:text-[18px]">
          <p>Time Allowed: {timeAllowed}</p>
          <p>Maximum Marks: {totalMarks}</p>
        </div>

        {/* Compulsory text */}
        <p className="w-full text-[14px] font-semibold leading-[160%] tracking-[-0.04em] text-[#303030] lg:text-[18px]">
          All questions are compulsory unless stated otherwise.
        </p>

        {/* Student info */}
        <div className="flex w-full flex-col items-start text-[14px] font-semibold leading-[160%] tracking-[-0.04em] text-[#303030] lg:text-[18px]">
          <p>Name: ______________________</p>
          <p>Roll Number: ________________</p>
          <p>Class: {className} Section: __________</p>
        </div>

        {/* Section */}
        <div className="flex w-full items-center justify-center">
          <h2 className="text-center text-[16px] font-semibold leading-[160%] tracking-[-0.04em] text-[#303030] lg:text-[24px]">
            Section A
          </h2>
        </div>

        {/* Instructions */}
        <div className="w-full text-[14px] font-semibold leading-[160%] tracking-[-0.04em] text-[#303030] lg:text-[18px]">
          {assignment?.questionTypes && assignment.questionTypes.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span>Instructions:</span>
              <ul className="list-disc pl-5 text-[14px] font-medium text-[#5E5E5E] lg:text-[16px]">
                {assignment.questionTypes.map((type, index) => (
                  <li key={index}>
                    {type.title}: {type.questions} question{type.questions > 1 ? "s" : ""}, {type.marks} Mark{type.marks > 1 ? "s" : ""} each.
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Attempt all questions. Each question carries marks as indicated in the question text.</p>
          )}
        </div>

        {/* Questions */}
        <ol className="w-full list-decimal space-y-[12px] pl-[22px] text-[16px] font-normal leading-[150%] tracking-[-0.04em] text-[#303030] lg:space-y-[18px] lg:leading-[240%]">
          {questions.map((question, index) => (
            <li key={index} className="pl-[4px]">
              {question}
            </li>
          ))}
        </ol>

        {/* End */}
        <p className="w-full text-center text-[16px] font-semibold leading-[160%] tracking-[-0.04em] text-[#303030]">
          End of Question Paper
        </p>

        {/* Answers */}
        {answers.length > 0 && (
          <div className="no-print w-full">
            <h3 className="mb-[16px] text-[16px] font-semibold leading-[160%] tracking-[-0.04em] text-[#303030] lg:text-[18px]">
              Answer Key:
            </h3>

            <ol className="list-decimal space-y-[12px] pl-[22px] text-[16px] font-normal leading-[150%] tracking-[-0.04em] text-[#303030] lg:leading-[200%]">
              {answers.map((answer, index) => (
                <li key={index} className="pl-[4px]">
                  {answer}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestionPaper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#d3d3d3] p-8 text-center font-semibold text-gray-500 lg:bg-[#efefef]">
          Loading Question Paper...
        </div>
      }
    >
      <QuestionPaperContent />
    </Suspense>
  );
}