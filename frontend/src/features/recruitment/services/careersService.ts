import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "../../../lib/firebase";
import type { Job } from "@hrms/middleware";

export interface ApplicationInput {
  tenantId: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  resumeUrl?: string;
  resumePath?: string;
}

export const CareersService = {
  /** List published & open jobs for a tenant (readable by unauthenticated visitors). */
  async listPublishedJobs(tenantId: string): Promise<Job[]> {
    const q = query(
      collection(db, "jobs"),
      where("tenantId", "==", tenantId),
      where("isPublished", "==", true),
      where("status", "==", "open")
    );
    const snap = await getDocs(q);
    const list: Job[] = [];
    snap.forEach((d) => list.push(d.data() as Job));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getPublishedJob(jobId: string): Promise<Job | null> {
    const snap = await getDoc(doc(db, "jobs", jobId));
    if (!snap.exists()) return null;
    const job = snap.data() as Job;
    if (!job.isPublished || job.status !== "open") return null;
    return job;
  },

  /** Upload an applicant's resume (allowed for unauthenticated visitors by storage rules). */
  async uploadResume(
    tenantId: string,
    file: File
  ): Promise<{ resumeUrl: string; resumePath: string }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const resumePath = `tenants/${tenantId}/resumes/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, resumePath);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const resumeUrl = await getDownloadURL(storageRef);
    return { resumeUrl, resumePath };
  },

  /**
   * Submit an application via the public `submitApplication` Cloud Function.
   * The function validates the job is published and creates the candidate
   * server-side (bypassing the authenticated-only candidates rules).
   */
  async submitApplication(input: ApplicationInput): Promise<{ success: boolean; candidateId: string }> {
    const fn = httpsCallable<ApplicationInput, { success: boolean; candidateId: string }>(
      functions,
      "submitApplication"
    );
    const res = await fn(input);
    return res.data;
  },
};
