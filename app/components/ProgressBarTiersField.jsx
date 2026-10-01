/* eslint-disable react/prop-types -- plain JS project, no PropTypes convention elsewhere */
import { useState } from "react";

const EMPTY_ROW = { minimumAmount: "", percentage: "" };

export function ProgressBarTiersField({ initialRows }) {
  const [rows, setRows] = useState(
    initialRows && initialRows.length > 0
      ? initialRows.map((r) => ({
          minimumAmount: String(r.minimumAmount ?? ""),
          percentage: String(r.percentage ?? ""),
        }))
      : [{ ...EMPTY_ROW }],
  );

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <s-stack direction="block" gap="base">
      <s-text>Tiers (spend at least this much to unlock this % off the order)</s-text>

      {rows.map((row, index) => (
        <s-stack direction="inline" gap="base" key={index} alignItems="end">
          <s-text-field
            label="Minimum cart value"
            name="tierMinimumAmount"
            type="number"
            min="0"
            step="0.01"
            value={row.minimumAmount}
            onInput={(event) => updateRow(index, "minimumAmount", event.currentTarget.value)}
          />
          <s-text-field
            label="Percent off"
            name="tierPercentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={row.percentage}
            onInput={(event) => updateRow(index, "percentage", event.currentTarget.value)}
          />
          {rows.length > 1 && (
            <s-button variant="tertiary" tone="critical" type="button" onClick={() => removeRow(index)}>
              Remove
            </s-button>
          )}
        </s-stack>
      ))}

      <s-button variant="secondary" type="button" onClick={addRow}>
        + Add another tier
      </s-button>
    </s-stack>
  );
}
