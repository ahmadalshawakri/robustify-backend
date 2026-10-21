import { Step, StepLabel, Stepper, useMediaQuery, useTheme } from "@mui/material";
import { LABELS, ORDER_STATUSES, type OrderStatus } from "@robustify/shared";

/** Where an order is in the press, from not started to completed. */
export function StageStepper({ status }: { status: OrderStatus }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up("md"));
  const active = ORDER_STATUSES.indexOf(status);
  return (
    <Stepper
      activeStep={status === "COMPLETED" ? ORDER_STATUSES.length : active}
      alternativeLabel={wide}
      orientation={wide ? "horizontal" : "vertical"}
      aria-label="Order stage"
    >
      {ORDER_STATUSES.map((stage) => (
        <Step key={stage}>
          <StepLabel>{LABELS.orderStatus[stage]}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
