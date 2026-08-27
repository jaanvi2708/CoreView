"use client";

import React, { useState, useEffect } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { useRole } from "@/context/RoleContext";
import MetricCard from "@/components/common/MetricCard";
import StatusBadge from "@/components/common/StatusBadge";
import ZoneSwitcher from "@/components/layout/ZoneSwitcher";
import { fetchAIModels, fetchAIPrescriptions, submitAIFeedback } from "@/lib/api";
import { AIModelMetrics, AIPrescriptionItem } from "@/lib/types";
import { Cpu, CheckCircle2, Lock, Sliders, Activity } from "lucide-react";

export default function AICommandCenterPage() {
  const { assets } = useTelemetry();
  const { role, roleInfo, hasPermission } = useRole();
  const [models, setModels] = useState<AIModelMetrics[]>([]);
  const [prescriptions, setPrescriptions] = useState<AIPrescriptionItem[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [retrainNotice, setRetrainNotice] = useState<string | null>(null);

  const loadData = async () => {
    const [m, p] = await Promise.all([fetchAIModels(), fetchAIPrescriptions()]);
    setModels(m);
    setPrescriptions(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFeedback = async (prescriptionId: string, action: "Approved" | "Rejected" | "Overridden") => {
    if (!hasPermission("canApproveAIPrescriptions")) {
      setFeedbackNotice("Requires Level 2 (Supervisor) or Level 3 (Reliability Eng) clearance.");
      setTimeout(() => setFeedbackNotice(null), 3500);
      return;
    }

    const notes = reviewNotes[prescriptionId] || "";
    await submitAIFeedback(prescriptionId, action, notes, roleInfo.userTitle);
    setPrescriptions(prev =>
      prev.map(p => (p.id === prescriptionId ? { ...p, feedback_status: action, feedback_notes: notes, reviewed_by: roleInfo.userTitle } : p))
    );
    setFeedbackNotice(`Prescription ${prescriptionId} marked as ${action}`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleRetrainAll = () => {
    if (!hasPermission("canRetrainAIModels")) {
      setRetrainNotice("Requires Level 3 (Reliability Eng) or Level 4 (Admin) clearance to retrain models.");
      setTimeout(() => setRetrainNotice(null), 3500);
      return;
    }

    setRetrainNotice("Triggered ML Retraining Pipeline across all ensemble models...");
    setTimeout(() => {
      setRetrainNotice("Retraining completed! Weights updated to latest 24/7 telemetry.");
      setTimeout(() => setRetrainNotice(null), 4000);
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* 1-Click Zone Switcher Ribbon */}
      <ZoneSwitcher />

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-4 rounded-md shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#58a6ff]" />
            <h2 className="text-base font-bold font-mono text-[#f0f6fc] uppercase tracking-tight">
              AI Command Center & Prescriptive Reasoning
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
              {roleInfo.badge}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] font-mono mt-0.5">
            Fleet Model Governance • Real-Time Quantile Inference • Human-in-the-Loop Validation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {retrainNotice && (
            <span className="text-xs font-mono text-[#3fb950] bg-[#238636]/15 border border-[#238636]/40 px-3 py-1.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {retrainNotice}
            </span>
          )}
          <button
            onClick={handleRetrainAll}
            className={`px-3.5 py-1.5 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
              hasPermission("canRetrainAIModels")
                ? "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] shadow-sm"
                : "bg-[#161b22] text-[#484f58] border border-[#21262d] cursor-not-allowed"
            }`}
            title={hasPermission("canRetrainAIModels") ? "Trigger Retraining Pipeline" : "Requires Level 3+ clearance"}
          >
            <Sliders className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Trigger Full Retraining</span>
            {!hasPermission("canRetrainAIModels") && <Lock className="w-3 h-3 text-[#484f58]" />}
          </button>
        </div>
      </div>

      {/* Row 1: AI Model Fleet Performance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Active Model Fleet"
          value="4 Models"
          status="healthy"
          subtitle="Ensemble Online & Valid"
        />
        <MetricCard
          title="Quantile RUL Accuracy"
          value="96.2%"
          unit="F1 Score"
          status="healthy"
          subtitle="MAE: 3.4 cycles"
        />
        <MetricCard
          title="Inference Latency"
          value="4.8"
          unit="ms"
          status="cyan"
          subtitle="Real-time Stream Engine"
        />
        <MetricCard
          title="Concept Drift (PSI)"
          value="0.042"
          status="healthy"
          subtitle="Population Drift: Optimal (<0.10)"
        />
      </div>

      {/* Row 2: Active AI Models Status Table */}
      <div className="scada-card p-4 bg-[#161b22]">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5 mb-3">
          <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
            Active Model Registry & Health Monitoring
          </h3>
          <span className="text-[10px] font-mono text-[#8b949e]">Continuous Drift & PSI Surveillance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#30363d] text-[#8b949e] text-[10px] uppercase">
                <th className="pb-2">Model Identifier</th>
                <th className="pb-2">Architecture</th>
                <th className="pb-2">Target Metric</th>
                <th className="pb-2">Accuracy / R²</th>
                <th className="pb-2">Drift (PSI)</th>
                <th className="pb-2">Latency</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/60">
              {models.map(m => (
                <tr key={m.model_name} className="hover:bg-[#21262d]/40">
                  <td className="py-2.5 font-bold text-[#f0f6fc]">{m.model_name}</td>
                  <td className="py-2.5 text-[#8b949e]">{m.model_type}</td>
                  <td className="py-2.5 text-[#c9d1d9]">{m.target}</td>
                  <td className="py-2.5 text-[#3fb950] font-semibold">{m.r2_score ? `R² ${m.r2_score}` : `${(m.accuracy_score * 100).toFixed(1)}%`}</td>
                  <td className="py-2.5 text-[#c9d1d9]">{m.psi_drift_index}</td>
                  <td className="py-2.5 text-[#8b949e]">{m.inference_latency_ms} ms</td>
                  <td className="py-2.5">
                    <StatusBadge status={m.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Prescriptive Recommendations Queue with Human-in-the-Loop Feedback */}
      <div className="scada-card p-4 bg-[#161b22]">
        <div className="flex flex-wrap items-center justify-between border-b border-[#30363d] pb-2.5 mb-3 gap-2">
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              Prescriptive Recommendations Queue (Human-In-The-Loop)
            </h3>
            <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">
              Station operators and reliability engineers can confirm, reject, or override AI suggested interventions
            </p>
          </div>
          {feedbackNotice && (
            <span className="text-xs font-mono text-[#3fb950] bg-[#238636]/15 border border-[#238636]/40 px-2.5 py-1 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {feedbackNotice}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {prescriptions.map(rx => {
            return (
              <div
                key={rx.id}
                className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={rx.urgency === "Immediate" ? "CRITICAL" : "WARNING"} size="sm" />
                    <span className="text-xs font-mono font-bold text-[#f0f6fc]">
                      {rx.asset_id.toUpperCase()}: {rx.asset_name}
                    </span>
                    <span className="text-[11px] font-mono text-[#8b949e]">
                      (Defect: <strong className="text-[#c9d1d9]">{rx.predicted_failure_mode}</strong>)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#8b949e]">
                      Confidence: <strong className="text-[#58a6ff]">{rx.confidence}%</strong>
                    </span>
                    <span className="text-[10px] font-mono text-[#8b949e]">
                      Lead Time: <strong className="text-[#e3b341]">{rx.lead_time_hours}h</strong>
                    </span>
                    <StatusBadge status={rx.feedback_status} size="sm" />
                  </div>
                </div>

                <div className="p-3 bg-[#161b22] rounded border border-[#30363d] text-xs font-mono text-[#c9d1d9] leading-relaxed">
                  <strong className="text-[#58a6ff] block mb-1">Recommended Prescriptive Action:</strong>
                  {rx.recommended_action}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#30363d] text-xs font-mono">
                  <span className="text-[#8b949e]">
                    Estimated Avoidance Value: <strong className="text-[#3fb950]">${(rx.estimated_downtime_avoidance_usd / 1000).toFixed(0)}k</strong>
                  </span>

                  {/* Feedback Action Buttons */}
                  <div className="flex items-center gap-2">
                    {rx.feedback_status === "Pending Review" ? (
                      <>
                        <input
                          type="text"
                          placeholder="Operator notes..."
                          value={reviewNotes[rx.id] || ""}
                          onChange={e => setReviewNotes({ ...reviewNotes, [rx.id]: e.target.value })}
                          className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded px-2.5 py-1 text-xs font-mono placeholder:text-[#6e7681] focus:outline-none focus:border-[#388bfd] w-44"
                        />
                        <button
                          onClick={() => handleFeedback(rx.id, "Approved")}
                          disabled={!hasPermission("canApproveAIPrescriptions")}
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            hasPermission("canApproveAIPrescriptions")
                              ? "bg-[#238636] hover:bg-[#2ea043] text-white"
                              : "bg-[#21262d] text-[#484f58] cursor-not-allowed"
                          }`}
                        >
                          Approve Action
                        </button>
                        <button
                          onClick={() => handleFeedback(rx.id, "Rejected")}
                          disabled={!hasPermission("canApproveAIPrescriptions")}
                          className={`px-2.5 py-1 rounded text-xs border ${
                            hasPermission("canApproveAIPrescriptions")
                              ? "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]"
                              : "bg-[#161b22] text-[#484f58] border-[#21262d] cursor-not-allowed"
                          }`}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleFeedback(rx.id, "Overridden")}
                          disabled={!hasPermission("canApproveAIPrescriptions")}
                          className={`px-2.5 py-1 rounded text-xs ${
                            hasPermission("canApproveAIPrescriptions")
                              ? "bg-[#d29922] hover:bg-[#e3b341] text-black font-semibold"
                              : "bg-[#21262d] text-[#484f58] cursor-not-allowed"
                          }`}
                        >
                          Override
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-[#8b949e]">
                        Reviewed by <strong className="text-[#c9d1d9]">{rx.reviewed_by}</strong>: {rx.feedback_notes || "No notes"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
