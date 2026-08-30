import { z } from "zod";

export const intakeSchema = z.object({
  age_hair_loss_began: z.number().min(5).max(80),
  duration: z.enum(["Less than 6 months", "6-12 months", "Over a year"]),
  family_history: z.array(z.enum(["Father had hair loss", "Mother had hair loss", "Siblings with thinning or baldness", "No known family history"])).min(1).refine(
    (arr) => {
      const hasNone = arr.includes("No known family history");
      return !(hasNone && arr.length > 1);
    },
    { message: "No known family history must be exclusive" }
  ),
  pattern: z.array(z.enum(["Receding hairline", "Thinning at crown", "Widening part line", "Diffuse thinning", "Patchy loss", "Sudden excessive shedding"])).min(1),
  diagnosed_conditions: z.array(z.enum(["PCOS/PCOD", "Thyroid disorder", "Diabetes", "Autoimmune disease", "Anemia", "None"])).min(1).refine(
    (arr) => {
      const hasNone = arr.includes("None");
      return !(hasNone && arr.length > 1);
    },
    { message: "None must be exclusive" }
  ),
  menstrual_cycle: z.enum(["Regular", "Irregular", "Menopausal", "Not applicable"]),
  pregnancy_related: z.enum(["Currently pregnant", "Postpartum <1 year", "Not applicable"]),
  adult_acne_oily_skin: z.boolean(),
  excess_body_facial_hair: z.boolean(),
  past_6_months: z.array(z.enum(["Crash dieting or major weight loss", "High stress or emotional trauma", "Fever with illness (COVID, Dengue, Typhoid)", "Recent surgery", "Change in location/water/air quality"])),
  habits: z.object({
    smoking: z.boolean(),
    smoking_severity: z.enum(["Mild <5/day", "Moderate 5-10/day", "Severe >10/day"]).nullable(),
    alcohol: z.boolean(),
    hard_water: z.boolean(),
    hair_wash_frequency: z.enum(["Daily", "Alternate Days", "Weekly"]),
    heating_tools_styling_chemicals: z.boolean(),
    salon_treatments: z.boolean(),
    salon_treatment_detail: z.string(),
  }).refine((h) => !h.smoking || h.smoking_severity !== null, { message: "Smoking severity required", path: ["smoking_severity"] })
    .refine((h) => !h.salon_treatments || h.salon_treatment_detail.trim().length > 0, { message: "Salon detail required", path: ["salon_treatment_detail"] }),
  products: z.record(z.object({
    used: z.boolean(),
    duration: z.enum(["<3mo", "3-6mo", ">6mo"]).nullable(),
    helped: z.boolean().nullable(),
    side_effects: z.boolean().nullable(),
  })).refine((rec) => Object.values(rec).every(v => !v.used || (v.duration !== null && v.helped !== null && v.side_effects !== null)), { message: "Product details incomplete" }),
  procedures: z.record(z.object({
    done: z.boolean(),
    sessions: z.enum(["1-3", "4-6", ">6"]).nullable(),
    helped: z.boolean().nullable(),
  })).refine((rec) => Object.values(rec).every(v => !v.done || (v.sessions !== null && v.helped !== null)), { message: "Procedure details incomplete" }),
  past_treatment_side_effects: z.boolean(),
  past_treatment_side_effects_describe: z.string(),
  sample_type: z.enum(["Saliva", "Blood", "Either"]),
  consent: z.boolean(),
}).refine((d) => !d.past_treatment_side_effects || d.past_treatment_side_effects_describe.trim().length > 0, { message: "Describe side effects", path: ["past_treatment_side_effects_describe"] });

export function validateIntake(data: unknown) {
  return intakeSchema.safeParse(data);
}
