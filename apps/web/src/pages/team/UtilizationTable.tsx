import {
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { LABELS } from "@robustify/shared";
import { useUtilization } from "../../api/hooks";
import { QueryState } from "../../components/QueryState";
import { displayName } from "../../lib/format";

/** Each employee's open work in their own stage, as a share of one working day. */
export function UtilizationTable() {
  const utilization = useUtilization();
  return (
    <QueryState query={utilization} empty="No employees yet.">
      {(employees) => (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="right">Open orders</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Utilization</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{displayName(e.username)}</TableCell>
                  <TableCell>{LABELS.department[e.department]}</TableCell>
                  <TableCell align="right">{e.openOrders}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(e.utilization, 100)}
                        color={
                          e.utilization > 100 ? "error" : e.utilization > 80 ? "warning" : "primary"
                        }
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        aria-label={`${displayName(e.username)} utilization`}
                      />
                      <Typography variant="body2" sx={{ width: 56, textAlign: "right" }}>
                        {e.utilization}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </QueryState>
  );
}
