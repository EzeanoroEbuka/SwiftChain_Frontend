export interface PricingPlan {
  id: string;
  name: string;
}

export type PricingFeatureValue = boolean | string;

export interface PricingFeatureRow {
  id: string;
  label: string;
  values: Record<string, PricingFeatureValue>;
}

export interface PricingComparison {
  plans: PricingPlan[];
  rows: PricingFeatureRow[];
}
