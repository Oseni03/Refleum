import { NextRequest, NextResponse, after } from "next/server";
import { requirePlan } from "@/lib/middleware";
import { tailorResume } from "@/server/resumes";
import { TailorStrategy } from "@prisma/client";
import { z } from "zod";
import { authenticate, parseBody, tailorSchema } from "@/lib/api";
import { recordUsage } from "@/server/subscription";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	// Plan gate check for tailoring
	const { allowed, error: planError } = await requirePlan(
		organizationId,
		"STARTER",
	);
	if (!allowed)
		return NextResponse.json({ error: planError }, { status: 403 });

	try {
		const { data: body, errResponse: bodyErr } = await parseBody(
			req,
			tailorSchema,
		);
		if (bodyErr) return bodyErr;

		// Tailoring itself still runs in-request for now as it produces the new resume record
		const result = await tailorResume(organizationId, {
			resumeId: id,
			jobDescription: body.jobDescription,
			strategy: body.strategy?.toUpperCase() as TailorStrategy,
			outputLanguage: body.outputLanguage?.toLowerCase(),
			generatePdf: body.generatePdf,
		});

		if (!result.success) {
			if (result.error === "NO_MASTER_RESUME") {
				return NextResponse.json(
					{
						error: "VALIDATION_ERROR",
						detail: "No master resume found. Provide resume_id or upload a master resume.",
					},
					{ status: 400 },
				);
			}
			return NextResponse.json({ error: result.error }, { status: 500 });
		}

		const data = result.data;

		await recordUsage(organizationId, "tailor", id);

		return NextResponse.json(
			{
				data: {
					resume_id: data.resume.id,
					is_master: data.resume.isMaster,
					status: data.resume.status,
					filename: data.resume.filename,
					strategy: data.resume.strategy,
					job_keywords: data.resume.jobKeywords,
					parent_id: data.resume.parentId,
					pdf_url: data.pdf_url,
					refinement_stats: data.refinement_stats,
					warnings: data.warnings,
				},
			},
			{ status: 201 },
		);
	} catch (e) {
		if (e instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "INVALID_INPUT", details: e.message },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "TAILORING_FAILED" },
			{ status: 500 },
		);
	}
}
