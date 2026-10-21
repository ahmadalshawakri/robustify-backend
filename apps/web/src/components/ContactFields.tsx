import { Grid, TextField } from "@mui/material";

type FieldProps = {
  name: string;
  value: string;
  error: boolean;
  helperText?: string;
  onChange: (event: { target: { value: string } }) => void;
};

/** Name, email, phone and address for a customer or supplier. */
export function ContactFields({
  field,
  prefix,
}: {
  field: (name: string) => FieldProps;
  prefix: string;
}) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth label="Name" {...field(`${prefix}.name`)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth label="Email" type="email" {...field(`${prefix}.email`)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth label="Phone" type="tel" {...field(`${prefix}.phone`)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth label="Address" {...field(`${prefix}.location`)} />
      </Grid>
    </Grid>
  );
}
