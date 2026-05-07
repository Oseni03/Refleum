// src/lib/cover-letter.ts

import { completeText } from "@/lib/llm";
import {
    COVER_LETTER_PROMPT,
    OUTREACH_MESSAGE_PROMPT,
    GENERATE_TITLE_PROMPT,
    getLanguageName,
} from "@/lib/prompts/templates";

import { getOrgFeaturePrompts } from "@/server/organizations";

async function resolveFeaturePrompt(
    orgId: string,
    configKey: "coverLetterPrompt" | "outreachMessagePrompt",
    defaultTemplate: string
): Promise<string> {
    try {
        const stored = await getOrgFeaturePrompts(orgId);
        const custom = (stored?.[configKey] ?? "").trim();
        return custom || defaultTemplate;
    } catch {
        return defaultTemplate;
    }
}

export async function generateCoverLetter(
    orgId: string,
    resumeData: Record<string, unknown>,
    jobDescription: string,
    language = "en"
): Promise<string> {
    const outputLanguage = getLanguageName(language);
    const template = await resolveFeaturePrompt(orgId, "coverLetterPrompt", COVER_LETTER_PROMPT);
    const prompt = template
        .replace("{job_description}", jobDescription)
        .replace("{resume_data}", JSON.stringify(resumeData))
        .replace("{output_language}", outputLanguage);

    const result = await completeText(orgId, prompt, {
        systemPrompt: "You are a professional career coach and resume writer. Write compelling, personalized cover letters.",
        maxTokens: 2048,
    });
    return result.trim();
}

export async function generateOutreachMessage(
    orgId: string,
    resumeData: Record<string, unknown>,
    jobDescription: string,
    language = "en"
): Promise<string> {
    const outputLanguage = getLanguageName(language);
    const template = await resolveFeaturePrompt(orgId, "outreachMessagePrompt", OUTREACH_MESSAGE_PROMPT);
    const prompt = template
        .replace("{job_description}", jobDescription)
        .replace("{resume_data}", JSON.stringify(resumeData))
        .replace("{output_language}", outputLanguage);

    const result = await completeText(orgId, prompt, {
        systemPrompt: "You are a professional networking coach. Write genuine, engaging cold outreach messages.",
        maxTokens: 1024,
    });
    return result.trim();
}

export async function generateResumeTitle(
    orgId: string,
    jobDescription: string,
    language = "en"
): Promise<string> {
    const outputLanguage = getLanguageName(language);
    const prompt = GENERATE_TITLE_PROMPT
        .replace("{job_description}", jobDescription)
        .replace("{output_language}", outputLanguage);

    const result = await completeText(orgId, prompt, {
        systemPrompt: "You extract job titles and company names from job descriptions.",
        maxTokens: 60,
        temperature: 0.3,
    });
    return result.trim().replace(/^["']|["']$/g, "").slice(0, 80);
}