// src/components/PieActiveArc.jsx
import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Tooltip as MUITooltip } from '@mui/material';

const PieActiveArc = ({ data, valueFormatter }) => {
  // Calculate total value for percentage calculations
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Enhance data with percentage
  const enhancedData = data.map((item) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(2),
  }));

  return (
    <PieChart
      series={[
        {
          data: enhancedData,
          highlightScope: { fade: 'global', highlight: 'item' },
          faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
          // Disable labels on pie slices
          labels: {
            visible: false,
          },
          // Value formatter for tooltips
          valueFormatter: (item) => `${item.percentage}%`,
          tooltip: {
            content: (item) => (
              <MUITooltip
                title={
                  <div>
                    <strong>{item.label}</strong>
                    <br />
                    {item.percentage}% of total
                  </div>
                }
                arrow
                placement="top"
              >
                <div></div>
              </MUITooltip>
            ),
          },
        },
      ]}
      height={300}
      legend={{
        labelFormatter: (label, index) => {
          const item = enhancedData[index];
          return `${item.label} (${item.percentage}%)`;
        },
      }}
    />
  );
};

export default PieActiveArc;
