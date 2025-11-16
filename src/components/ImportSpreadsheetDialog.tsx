import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
export const ImportSpreadsheetDialog = () => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseSpreadsheet = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Parse Page 1 - Monthly wear data
          const sheet1 = workbook.Sheets[workbook.SheetNames[0]];
          const rawData1 = XLSX.utils.sheet_to_json(sheet1, { header: 1 }) as any[][];
          const page1 = rawData1.slice(2).filter((row: any) => row[0] && row[1]).map((row: any) => ({
            brand: row[0],
            model: row[1],
            jan: parseFloat(row[4]) || 0,
            feb: parseFloat(row[5]) || 0,
            mar: parseFloat(row[6]) || 0,
            apr: parseFloat(row[7]) || 0,
            may: parseFloat(row[8]) || 0,
            jun: parseFloat(row[9]) || 0,
            jul: parseFloat(row[10]) || 0,
            aug: parseFloat(row[11]) || 0,
            sep: parseFloat(row[12]) || 0,
            oct: parseFloat(row[13]) || 0,
            nov: parseFloat(row[14]) || 0,
            dec: parseFloat(row[15]) || 0,
          }));

          // Parse Page 3 - Watch specs
          const sheet3 = workbook.Sheets[workbook.SheetNames[2]];
          const rawData3 = XLSX.utils.sheet_to_json(sheet3, { header: 1 }) as any[][];
          const page3 = rawData3.slice(1).filter((row: any) => row[0] && row[1]).map((row: any) => ({
            brand: row[0],
            model: row[1],
            price: row[2],
            movement: row[3],
            powerReserve: row[4],
            crystal: row[5],
            caseMaterial: row[6],
            caseSize: row[7],
            lugToLug: row[8],
            waterResistance: row[9],
            caseback: row[10],
            band: row[11],
          }));

          // Parse Page 4 - Personal notes
          const sheet4 = workbook.Sheets[workbook.SheetNames[3]];
          const rawData4 = XLSX.utils.sheet_to_json(sheet4, { header: 1 }) as any[][];
          const page4 = rawData4.slice(1).filter((row: any) => row[0] && row[1]).map((row: any) => ({
            brand: row[0],
            model: row[1],
            whyBought: row[2],
            whenBought: row[3],
            whatILike: row[4],
            whatIDontLike: row[5],
          }));

          // Parse Page 5 - Wishlist
          const sheet5 = workbook.Sheets[workbook.SheetNames[4]];
          const rawData5 = XLSX.utils.sheet_to_json(sheet5, { header: 1 }) as any[][];
          const page5 = rawData5.slice(1).filter((row: any) => row[0] && row[1]).map((row: any) => ({
            brand: row[0],
            model: row[1],
            dialColors: row[2],
            rank: parseInt(row[3]) || 0,
          }));

          resolve({ page1, page3, page4, page5 });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      setCurrentPhase("Parsing spreadsheet...");
      setProgress(10);
      
      const spreadsheetData = await parseSpreadsheet(file);

      setCurrentPhase("Phase 1: Clearing and repopulating wear entries...");
      setProgress(20);

      const { data, error } = await supabase.functions.invoke('import-spreadsheet-data', {
        body: { spreadsheetData }
      });

      if (error) throw error;

      setProgress(100);
      toast.success("Data import completed successfully!", {
        description: `Phase 1: ${data.results.phase1.message}\nPhase 2: ${data.results.phase2.message}\nPhase 3: ${data.results.phase3.message}\nPhase 4: ${data.results.phase4.message}\nPhase 5: ${data.results.phase5.message}`,
      });

      setOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Import error:', error);
      toast.error("Failed to import data", {
        description: error.message,
      });
    } finally {
      setImporting(false);
      setProgress(0);
      setCurrentPhase("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import Spreadsheet Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Spreadsheet Data</DialogTitle>
          <DialogDescription>
            This will import and synchronize all data from your Watch Track spreadsheet, including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Wear entries (monthly data)</li>
              <li>Watch specifications</li>
              <li>Personal notes</li>
              <li>Wishlist items</li>
              <li>AI-powered rarity and historical analysis</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        {importing && (
          <div className="space-y-4">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{currentPhase}</p>
          </div>
        )}

        {!importing && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Spreadsheet File</label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing || !file}>
            {importing ? "Importing..." : "Start Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
