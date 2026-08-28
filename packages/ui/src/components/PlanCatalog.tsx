import { Badge } from "./Badge";
import { Card, CardBody, CardMeta, CardTitle } from "./Card";
import { cx } from "../lib/cx";

export type PlanOption = {
  code: string;
  name: string;
  price: string;
  cadence?: string;
  limit: string;
  features: string[];
  featured?: boolean;
};

export function PlanCatalog({
  plans,
  currentPlan,
  className,
}: {
  plans: PlanOption[];
  currentPlan?: string | null;
  className?: string;
}) {
  return (
    <ul className={cx("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
      {plans.map((plan) => {
        const current = currentPlan === plan.code;
        return (
          <Card
            key={plan.code}
            as="li"
            variant={current ? "editorial" : "standard"}
            className={cx(
              "relative min-h-full border",
              current ? "border-accent/35" : "border-hairline",
              plan.featured && !current && "bg-panel-sage/45",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardMeta>Plano</CardMeta>
                <CardTitle className="mt-1">{plan.name}</CardTitle>
              </div>
              {current && <Badge tone="success">Plano atual</Badge>}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-hairline pb-4">
              <strong className="font-editorial text-h2 font-semibold text-primary">
                {plan.price}
              </strong>
              {plan.cadence && (
                <span className="type-meta text-tertiary">{plan.cadence}</span>
              )}
            </div>

            <CardBody className="font-medium text-primary">{plan.limit}</CardBody>
            <ul className="flex flex-col gap-2 text-ui-sm text-secondary">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden="true" className="text-positive">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </ul>
  );
}
