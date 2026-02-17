"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, HelpCircle, FlaskConical, Lightbulb } from "lucide-react";
import { SummaryView } from "./summary/SummaryView";
import { QuizView } from "./quiz/QuizView";
import { LabView } from "./lab/LabView";
import { TakeawaysView } from "./takeaways/TakeawaysView";
import type { Artifact, ArtifactType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ArtifactTabsProps {
  artifacts: Artifact[];
}

const tabConfig: { type: ArtifactType; label: string; icon: typeof FileText }[] = [
  { type: "summary", label: "Summary", icon: FileText },
  { type: "quiz", label: "Quiz", icon: HelpCircle },
  { type: "lab", label: "Lab", icon: FlaskConical },
  { type: "takeaways", label: "Takeaways", icon: Lightbulb },
];

function getLatestByType(artifacts: Artifact[]): Map<ArtifactType, Artifact> {
  const map = new Map<ArtifactType, Artifact>();
  for (const a of artifacts) {
    const existing = map.get(a.type);
    if (!existing || a.version > existing.version) {
      map.set(a.type, a);
    }
  }
  return map;
}

export function ArtifactTabs({ artifacts }: ArtifactTabsProps) {
  const latest = getLatestByType(artifacts);
  const availableTypes = Array.from(latest.keys());
  const [activeTab, setActiveTab] = useState<ArtifactType>(
    availableTypes[0] ?? "summary",
  );

  if (artifacts.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-card p-8 text-center">
        <p className="text-text-secondary text-sm">
          No artifacts yet. Generate some using the panel above.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ArtifactType)}
      >
        <TabsList className="bg-surface border border-border-subtle w-full justify-start gap-1 p-1 h-auto">
          {tabConfig.map(({ type, label, icon: Icon }) => {
            const hasArtifact = latest.has(type);
            return (
              <TabsTrigger
                key={type}
                value={type}
                disabled={!hasArtifact}
                className={cn(
                  "gap-1.5 text-sm data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:shadow-none",
                  !hasArtifact && "opacity-40",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "summary" && latest.get("summary") && (
              <SummaryView artifact={latest.get("summary")!} />
            )}
            {activeTab === "quiz" && latest.get("quiz") && (
              <QuizView artifact={latest.get("quiz")!} />
            )}
            {activeTab === "lab" && latest.get("lab") && (
              <LabView artifact={latest.get("lab")!} />
            )}
            {activeTab === "takeaways" && latest.get("takeaways") && (
              <TakeawaysView artifact={latest.get("takeaways")!} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
