import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { DataStore } from './types';

let cache: DataStore | null = null;

function loadCSV<T>(filename: string): T[] {
  const filePath = path.join(process.cwd(), 'hvac_construction_dataset', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = Papa.parse<T>(content, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return data;
}

export function getData(): DataStore {
  if (cache) return cache;

  cache = {
    contracts: loadCSV('contracts.csv'),
    sov: loadCSV('sov.csv'),
    sovBudget: loadCSV('sov_budget.csv'),
    laborLogs: loadCSV('labor_logs.csv'),
    materialDeliveries: loadCSV('material_deliveries.csv'),
    billingHistory: loadCSV('billing_history.csv'),
    billingLineItems: loadCSV('billing_line_items.csv'),
    changeOrders: loadCSV('change_orders.csv'),
    rfis: loadCSV('rfis.csv'),
    fieldNotes: loadCSV('field_notes.csv'),
  };

  return cache;
}
