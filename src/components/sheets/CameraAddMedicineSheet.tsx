"use client";

import { useEffect, useRef } from "react";
import { recognizeMedicineNames } from "@/lib/ocr";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import MedicineFieldRow from "@/components/meds/MedicineFieldRow";
import type { DoseUnit } from "@/types/records";
import styles from "./CameraAddMedicineSheet.module.css";
import sheetStyles from "./sheets.module.css";

const OCR_FAILED_MSG = "読み取れませんでした";

const emptyDraft = () => ({ name: "", doseAmount: "", doseUnit: "錠" as DoseUnit });

export default function CameraAddMedicineSheet() {
  const cameraSheet = useUiStore((s) => s.cameraSheet);
  const patchCameraSheet = useUiStore((s) => s.patchCameraSheet);
  const closeCameraSheet = useUiStore((s) => s.closeCameraSheet);
  const showToast = useUiStore((s) => s.showToast);
  const addMedicineWithName = useAppStore((s) => s.addMedicineWithName);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capturedBlobRef = useRef<Blob | null>(null);

  const status = cameraSheet?.status;

  useEffect(() => {
    if (status !== "camera") return undefined;
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      patchCameraSheet({ cameraPhase: "unavailable" });
      return undefined;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        patchCameraSheet({ cameraPhase: "live" });
      })
      .catch(() => {
        if (!cancelled) patchCameraSheet({ cameraPhase: "unavailable" });
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [status, patchCameraSheet]);

  // cameraPhaseが"live"になって初めて<video>がDOMに現れるため、
  // streamの取得(上のeffect)とは別に、<video>が実際にマウントされた後にアタッチする
  useEffect(() => {
    if (cameraSheet?.cameraPhase === "live" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraSheet?.cameraPhase]);

  if (!cameraSheet) return null;

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const runOcr = async (image: Blob) => {
    try {
      const names = await recognizeMedicineNames(image);
      if (names.length === 0) {
        patchCameraSheet({ status: "error", errorMsg: OCR_FAILED_MSG });
      } else {
        patchCameraSheet({
          status: "done",
          drafts: names.map((name) => ({ ...emptyDraft(), name })),
        });
      }
    } catch {
      patchCameraSheet({ status: "error", errorMsg: OCR_FAILED_MSG });
    }
  };

  const updateDraft = (i: number, patch: Partial<ReturnType<typeof emptyDraft>>) => {
    const drafts = cameraSheet.drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d));
    patchCameraSheet({ drafts });
  };

  const removeDraft = (i: number) => {
    patchCameraSheet({ drafts: cameraSheet.drafts.filter((_, idx) => idx !== i) });
  };

  const handleCaptured = (blob: Blob) => {
    stopStream();
    capturedBlobRef.current = blob;
    const imageUrl = URL.createObjectURL(blob);
    patchCameraSheet({ status: "recognizing", imageUrl });
    runOcr(blob);
  };

  const retry = () => {
    const blob = capturedBlobRef.current;
    if (!blob) return;
    patchCameraSheet({ status: "recognizing", errorMsg: undefined });
    runOcr(blob);
  };

  const retakePhoto = () => {
    capturedBlobRef.current = null;
    if (cameraSheet.imageUrl) URL.revokeObjectURL(cameraSheet.imageUrl);
    patchCameraSheet({
      status: "camera",
      cameraPhase: "starting",
      imageUrl: null,
      drafts: [],
      errorMsg: undefined,
    });
  };

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) handleCaptured(blob);
    }, "image/jpeg", 0.92);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleCaptured(file);
  };

  const cancel = () => {
    stopStream();
    capturedBlobRef.current = null;
    if (cameraSheet.imageUrl) URL.revokeObjectURL(cameraSheet.imageUrl);
    closeCameraSheet();
  };

  const confirm = () => {
    cameraSheet.drafts
      .filter((d) => d.name.trim().length > 0)
      .forEach((d) => addMedicineWithName({ ...d, name: d.name.trim() }));
    capturedBlobRef.current = null;
    if (cameraSheet.imageUrl) URL.revokeObjectURL(cameraSheet.imageUrl);
    closeCameraSheet();
    showToast("追加しました");
  };

  return (
    <>
      <div
        data-testid="camera-sheet-overlay"
        onClick={cancel}
        className={`overlay ${sheetStyles.overlay}`}
      />
      <div data-testid="camera-sheet" className={sheetStyles.sheet}>
        <div className={sheetStyles.title}>📷 カメラからおくすりを追加</div>

        {cameraSheet.status === "camera" && (
          <div className={styles.captureArea}>
            {cameraSheet.cameraPhase === "live" && (
              <>
                <div className={styles.hintText}>
                  くすりの名前の部分を大きく写すと読み取りやすくなります
                </div>
                <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
                <button
                  data-testid="camera-shutter"
                  onClick={shoot}
                  className={styles.shutterBtn}
                >
                  📸
                </button>
              </>
            )}
            {cameraSheet.cameraPhase === "starting" && (
              <div className={styles.pendingText}>カメラを起動しています…</div>
            )}
            {cameraSheet.cameraPhase === "unavailable" && (
              <div className={styles.pendingText}>
                カメラを使用できませんでした。写真を選んでください。
              </div>
            )}
            <button
              data-testid="camera-pick-photo"
              onClick={() => fileInputRef.current?.click()}
              className={styles.pickPhotoBtn}
            >
              写真を選ぶ
            </button>
            <input
              ref={fileInputRef}
              data-testid="camera-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
          </div>
        )}

        {cameraSheet.status !== "camera" && (
          <div className={styles.reviewArea}>
            {cameraSheet.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cameraSheet.imageUrl} alt="" className={styles.thumb} />
            )}
            {cameraSheet.status === "recognizing" && (
              <div data-testid="camera-status-recognizing" className={styles.statusRow}>
                <span className={styles.spinner} />
                読み取り中…
              </div>
            )}
            {cameraSheet.status === "error" && (
              <div className={styles.errorRow}>
                <div data-testid="camera-error" className={styles.errorText}>
                  {cameraSheet.errorMsg}
                </div>
                <div className={styles.errorActions}>
                  <button data-testid="camera-retry" onClick={retry} className={styles.retryBtn}>
                    🔄 もう一度読み取る
                  </button>
                  <button
                    data-testid="camera-retake"
                    onClick={retakePhoto}
                    className={styles.retryBtn}
                  >
                    🖼 別の写真で撮り直す
                  </button>
                </div>
              </div>
            )}
            {cameraSheet.status === "done" && (
              <div className={styles.draftsList}>
                {cameraSheet.drafts.map((d, i) => (
                  <MedicineFieldRow
                    key={i}
                    testIdPrefix="camera-draft"
                    index={i}
                    name={d.name}
                    doseAmount={d.doseAmount}
                    doseUnit={d.doseUnit}
                    onChangeName={(v) => updateDraft(i, { name: v })}
                    onChangeDoseAmount={(v) => updateDraft(i, { doseAmount: v })}
                    onChangeDoseUnit={(v) => updateDraft(i, { doseUnit: v })}
                    onDelete={() => removeDraft(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className={sheetStyles.footRow}>
          <button data-testid="camera-cancel" onClick={cancel} className={sheetStyles.cancelBtn}>
            やめる
          </button>
          {cameraSheet.status === "done" && (
            <button
              data-testid="camera-confirm"
              onClick={confirm}
              className={sheetStyles.saveBtn}
            >
              これでOK
            </button>
          )}
        </div>
      </div>
    </>
  );
}
