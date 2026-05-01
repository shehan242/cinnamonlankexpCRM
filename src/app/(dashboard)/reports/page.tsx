
'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { summarizeReport } from '@/ai/flows/ai-report-summaries';
import { 
  BarChart3, 
  FileDown, 
  Sparkles, 
  ArrowRight,
  PieChart,
  Calendar,
  Table as TableIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { invoices, customers, products } = useAppStore();
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const generateAISummary = async () => {
    setSummarizing(true);
    try {
      const reportText = `
        Sales Report for ${new Date().toLocaleDateString()}
        Total Revenue: $${invoices.reduce((a,b) => a+b.total, 0)}
        Total Invoices: ${invoices.length}
        Invoices Paid: ${invoices.filter(i => i.status === 'Paid').length}
        Invoices Pending: ${invoices.filter(i => i.status === 'Pending').length}
      `;
      const result = await summarizeReport({ reportText });
      setAiSummary(result.summary);
    } catch (err) {
      toast({ title: "AI Summary Error", description: "Failed to generate report summary.", variant: "destructive" });
    } finally {
      setSummarizing(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare invoice data
      const invoiceData = invoices.map(inv => {
        const customer = customers.find(c => c.id === inv.customerId);
        return {
          'Invoice #': inv.invoiceNumber,
          'Customer': customer?.name || 'Unknown',
          'Date': inv.date,
          'Total Amount ($)': inv.total,
          'Status': inv.status
        };
      });

      // Prepare product data
      const productData = products.map(p => ({
        'Name': p.name,
        'SKU': p.sku,
        'Stock': p.stock,
        'Price (USD)': p.priceUSD,
        'Category': p.category
      }));

      const wb = XLSX.utils.book_new();
      
      const wsInvoices = XLSX.utils.json_to_sheet(invoiceData);
      XLSX.utils.book_append_sheet(wb, wsInvoices, "Invoices");

      const wsProducts = XLSX.utils.json_to_sheet(productData);
      XLSX.utils.book_append_sheet(wb, wsProducts, "Inventory");

      XLSX.writeFile(wb, `CinnamonLink_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({ title: "Export Successful", description: "Report has been exported to Excel." });
    } catch (err) {
      toast({ title: "Export Failed", description: "Could not generate Excel file.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Intelligence & Reports</h1>
          <p className="text-muted-foreground">Consolidated data and automated insights.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </Button>
          <Button className="gap-2 shadow-md" onClick={exportToExcel}>
            <FileDown className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Annual Performance</CardTitle>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-64 bg-muted/20 rounded-xl flex items-center justify-center border-2 border-dashed border-muted">
              <div className="text-center space-y-2">
                <PieChart className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Detailed visual analytics</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Q1 Growth</p>
                <p className="text-lg font-bold text-green-600">+14%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Efficiency</p>
                <p className="text-lg font-bold text-blue-600">92%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Retention</p>
                <p className="text-lg font-bold text-primary">88%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary/5 h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Executive Summary
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white" 
              onClick={generateAISummary}
              disabled={summarizing}
            >
              {summarizing ? 'Analyzing...' : 'Refresh AI'}
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {aiSummary ? (
              <div className="prose prose-sm text-muted-foreground">
                <p className="whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-primary">Get Business Insights</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-2">
                  Generate a natural language summary of your sales data to identify trends and anomalies.
                </p>
                <Button variant="link" className="mt-4" onClick={generateAISummary}>
                  Click to Analyze <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Best Selling Product</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Cinnamon Alba C5</p>
            <p className="text-xs text-muted-foreground mt-1">450kg sold this month</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Top Country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">Germany</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">32% of total revenue</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Customer Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Highly Positive</p>
            <p className="text-xs text-muted-foreground mt-1">Based on recent CRM notes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
