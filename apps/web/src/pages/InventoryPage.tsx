import {
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { MATERIALS } from "@robustify/shared";
import { useInventory } from "../api/hooks";
import { PageHeader } from "../components/PageHeader";
import { QueryState } from "../components/QueryState";
import { formatNumber } from "../lib/format";

export function InventoryPage() {
  const inventory = useInventory();
  return (
    <>
      <PageHeader
        title="Stock"
        subtitle="Receiving a purchase adds to stock; starting printing takes paper out."
      />
      <Card variant="outlined">
        <QueryState query={inventory}>
          {(items) => (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">In stock</TableCell>
                    <TableCell align="right">Packs</TableCell>
                    <TableCell align="right">On order</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={`${item.category}-${item.materialType}`}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{MATERIALS[item.category].label}</TableCell>
                      <TableCell align="right">
                        {formatNumber(item.quantity)} {item.unit}
                      </TableCell>
                      <TableCell align="right">
                        {item.packs}
                        {item.low && (
                          <Chip size="small" color="warning" label="Low" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell align="right">{item.incomingPacks || "—"}</TableCell>
                      <TableCell>{item.location ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </QueryState>
      </Card>
    </>
  );
}
