// Intake state mirrors intake-schema.json keys 1:1 for direct validation/export
export type Duration = "Less than 6 months" | "6-12 months" | "Over a year";
export type FamilyOption = "Father had hair loss" | "Mother had hair loss" | "Siblings with thinning or baldness" | "No known family history";
export type PatternOption = "Receding hairline" | "Thinning at crown" | "Widening part line" | "Diffuse thinning" | "Patchy loss" | "Sudden excessive shedding";
export type ConditionOption = "PCOS/PCOD" | "Thyroid disorder" | "Diabetes" | "Autoimmune disease" | "Anemia" | "None";
export type MenstrualOption = "Regular" | "Irregular" | "Menopausal" | "Not applicable";
export type PregnancyOption = "Currently pregnant" | "Postpartum <1 year" | "Not applicable";
export type Past6Option = "Crash dieting or major weight loss" | "High stress or emotional trauma" | "Fever with illness (COVID, Dengue, Typhoid)" | "Recent surgery" | "Change in location/water/air quality";
export type SmokingSeverity = "Mild <5/day" | "Moderate 5-10/day" | "Severe >10/day";
export type WashFreq = "Daily" | "Alternate Days" | "Weekly";
export type ProductRowKey = "OTC/Medicated Shampoos" | "Hair Oils/Serums" | "Topical Minoxidil" | "Oral Minoxidil" | "Supplements";
export type ProcedureRowKey = "PRP/GFC/iPRF" | "Stem Cells/Exosomes" | "Hair Transplant" | "Other";
export type ProductDuration = "<3mo" | "3-6mo" | ">6mo";
export type ProcedureSessions = "1-3" | "4-6" | ">6";
export type SampleType = "Saliva" | "Blood" | "Either";

export type Applicability = "applies" | "does_not_apply" | null; // Q6/Q7 gate

export interface HabitState {
  smoking: boolean | null;
  smoking_severity: SmokingSeverity | null;
  alcohol: boolean | null;
  hard_water: boolean | null;
  hair_wash_frequency: WashFreq | null;
  heating_tools_styling_chemicals: boolean | null;
  salon_treatments: boolean | null;
  salon_treatment_detail: string;
}

export interface ProductEntry {
  used: boolean;
  duration: ProductDuration | null;
  helped: boolean | null;
  side_effects: boolean | null;
}

export interface ProcedureEntry {
  done: boolean;
  sessions: ProcedureSessions | null;
  helped: boolean | null;
}

export interface IntakeState {
  // Q1-4
  age_hair_loss_began: number | null;
  duration: Duration | null;
  family_history: FamilyOption[];
  pattern: PatternOption[];
  // Q5-9
  diagnosed_conditions: ConditionOption[];
  menstrual_cycle: MenstrualOption | null;
  pregnancy_related: PregnancyOption | null;
  adult_acne_oily_skin: boolean | null;
  excess_body_facial_hair: boolean | null;
  // Q10-11
  past_6_months: Past6Option[];
  habits: HabitState;
  // Q12-14
  products: Record<ProductRowKey, ProductEntry>;
  procedures: Record<ProcedureRowKey, ProcedureEntry>;
  past_treatment_side_effects: boolean | null;
  past_treatment_side_effects_describe: string;
  // Q15-16
  sample_type: SampleType | null;
  consent: boolean | null;
  // transient UI only, not exported
  _applicability: Applicability;
}

export const PRODUCT_ROWS: ProductRowKey[] = ["OTC/Medicated Shampoos", "Hair Oils/Serums", "Topical Minoxidil", "Oral Minoxidil", "Supplements"];
export const PROCEDURE_ROWS: ProcedureRowKey[] = ["PRP/GFC/iPRF", "Stem Cells/Exosomes", "Hair Transplant", "Other"];

export function createInitialIntake(): IntakeState {
  return {
    age_hair_loss_began: null,
    duration: null,
    family_history: [],
    pattern: [],
    diagnosed_conditions: [],
    menstrual_cycle: null,
    pregnancy_related: null,
    adult_acne_oily_skin: null,
    excess_body_facial_hair: null,
    past_6_months: [],
    habits: {
      smoking: null,
      smoking_severity: null,
      alcohol: null,
      hard_water: null,
      hair_wash_frequency: null,
      heating_tools_styling_chemicals: null,
      salon_treatments: null,
      salon_treatment_detail: "",
    },
    products: {
      "OTC/Medicated Shampoos": { used: false, duration: null, helped: null, side_effects: null },
      "Hair Oils/Serums": { used: false, duration: null, helped: null, side_effects: null },
      "Topical Minoxidil": { used: false, duration: null, helped: null, side_effects: null },
      "Oral Minoxidil": { used: false, duration: null, helped: null, side_effects: null },
      "Supplements": { used: false, duration: null, helped: null, side_effects: null },
    },
    procedures: {
      "PRP/GFC/iPRF": { done: false, sessions: null, helped: null },
      "Stem Cells/Exosomes": { done: false, sessions: null, helped: null },
      "Hair Transplant": { done: false, sessions: null, helped: null },
      "Other": { done: false, sessions: null, helped: null },
    },
    past_treatment_side_effects: null,
    past_treatment_side_effects_describe: "",
    sample_type: null,
    consent: null,
    _applicability: null,
  };
}

// Build the exact JSON that must be displayed/validated — matches intake-schema.json keys
export function toStructuredOutput(s: IntakeState) {
  // Apply applicability rule: if does_not_apply, force Not applicable for schema compliance
  const menstrual_cycle = s._applicability === "does_not_apply" ? "Not applicable" : s.menstrual_cycle;
  const pregnancy_related = s._applicability === "does_not_apply" ? "Not applicable" : s.pregnancy_related;

  return {
    age_hair_loss_began: s.age_hair_loss_began,
    duration: s.duration,
    family_history: s.family_history,
    pattern: s.pattern,
    diagnosed_conditions: s.diagnosed_conditions,
    menstrual_cycle,
    pregnancy_related,
    adult_acne_oily_skin: s.adult_acne_oily_skin,
    excess_body_facial_hair: s.excess_body_facial_hair,
    past_6_months: s.past_6_months,
    habits: {
      smoking: s.habits.smoking,
      smoking_severity: s.habits.smoking ? s.habits.smoking_severity : null,
      alcohol: s.habits.alcohol,
      hard_water: s.habits.hard_water,
      hair_wash_frequency: s.habits.hair_wash_frequency,
      heating_tools_styling_chemicals: s.habits.heating_tools_styling_chemicals,
      salon_treatments: s.habits.salon_treatments,
      salon_treatment_detail: s.habits.salon_treatments ? s.habits.salon_treatment_detail : "",
    },
    products: s.products,
    procedures: s.procedures,
    past_treatment_side_effects: s.past_treatment_side_effects,
    past_treatment_side_effects_describe: s.past_treatment_side_effects ? s.past_treatment_side_effects_describe : "",
    sample_type: s.sample_type,
    consent: s.consent,
  };
}
