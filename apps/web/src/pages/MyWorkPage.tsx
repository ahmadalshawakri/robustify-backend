import { Card, CardContent, Typography } from "@mui/material";
import { LABELS } from "@robustify/shared";
import { useOrders } from "../api/hooks";
import { useUser } from "../auth/AuthProvider";
import { PageHeader } from "../components/PageHeader";
import { QueryState } from "../components/QueryState";
import { displayName } from "../lib/format";
import { OrdersTable } from "./orders/OrdersTable";

/** An employee's home: what is assigned to them and what waits in their department. */
export function MyWorkPage() {
  const user = useUser();
  const orders = useOrders();
  const department = LABELS.department[user.department];

  return (
    <>
      <PageHeader
        title={`Hello, ${displayName(user.username).split(" ")[0]}`}
        subtitle={`Orders in ${department}. Open one to move it to the next stage.`}
      />
      <QueryState query={orders}>
        {(all) => {
          const mine = all.filter((o) => o.assignee?.id === user.id);
          const queue = all.filter(
            (o) => o.assignee?.id !== user.id && o.stageOwner === user.department,
          );
          return (
            <>
              <Section title="Assigned to me" empty="Nothing assigned to you right now.">
                {mine.length > 0 && <OrdersTable orders={mine} />}
              </Section>
              <Section
                title={`Waiting in ${department}`}
                empty={`No other orders waiting in ${department}.`}
              >
                {queue.length > 0 && <OrdersTable orders={queue} />}
              </Section>
            </>
          );
        }}
      </QueryState>
    </>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {children || <Typography color="text.secondary">{empty}</Typography>}
      </CardContent>
    </Card>
  );
}
