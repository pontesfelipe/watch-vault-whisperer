import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

export const ImportSpreadsheetDialog = () => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("");

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);

    try {
      // Parse the spreadsheet data structure
      const spreadsheetData = {
        page1: [
          { brand: "Baltic", model: "Tricompax Tour Auto", jan: 1, feb: 2, mar: 2, apr: 3, may: 0, jun: 2, jul: 1, aug: 1, sep: 3, oct: 1, nov: 0, dec: 0 },
          { brand: "Breitling", model: "Navitimer GMT", jan: 1, feb: 3, mar: 2, apr: 4, may: 1, jun: 4, jul: 2, aug: 1, sep: 2, oct: 2, nov: 0.5, dec: 0 },
          { brand: "Breitling", model: "Superocean Heritage", jan: 1, feb: 3, mar: 6, apr: 3, may: 2, jun: 1, jul: 2, aug: 2, sep: 3, oct: 3, nov: 1, dec: 0 },
          { brand: "Casio", model: "Databank", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 1.5, dec: 0 },
          { brand: "Longines", model: "Legend Diver Bronze", jan: 2, feb: 2, mar: 3, apr: 1, may: 8, jun: 4, jul: 1.5, aug: 1, sep: 2, oct: 2, nov: 1, dec: 0 },
          { brand: "Swatch", model: "Moonswatch Earth", jan: 0, feb: 0, mar: 1, apr: 1, may: 1, jun: 0, jul: 0, aug: 0, sep: 2, oct: 0.5, nov: 0, dec: 0 },
          { brand: "Swatch", model: "Moonswatch Saturn", jan: 1, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 2, aug: 2, sep: 0, oct: 0, nov: 0, dec: 0 },
          { brand: "Omega", model: "Aqua Terra Beijing Winter Olympic Games 2022", jan: 0, feb: 0, mar: 2, apr: 3, may: 3, jun: 2, jul: 7, aug: 7.5, sep: 1, oct: 2.5, nov: 1, dec: 0 },
          { brand: "Omega", model: "Speedmaster Moonwatch Pro (Sapphire)", jan: 2, feb: 2, mar: 2, apr: 2, may: 1, jun: 2, jul: 2, aug: 1, sep: 3, oct: 1, nov: 2, dec: 0 },
          { brand: "Omega", model: "Speedmaster '57", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0 },
          { brand: "Omega", model: "Seamaster 300", jan: 1, feb: 3, mar: 2, apr: 3, may: 3, jun: 4, jul: 2.5, aug: 5, sep: 1, oct: 2.5, nov: 0, dec: 0 },
          { brand: "ORIS", model: "Artelier Pointer Day Date", jan: 1, feb: 2, mar: 5, apr: 2, may: 2, jun: 2, jul: 3, aug: 2.5, sep: 1, oct: 2, nov: 1, dec: 0 },
          { brand: "ORIS", model: "Propilot Coulson Ltd Edition", jan: 1, feb: 4, mar: 2, apr: 3, may: 4, jun: 2, jul: 1.5, aug: 1, sep: 3, oct: 2, nov: 0, dec: 0 },
          { brand: "IWC", model: "Mark XX", jan: 0, feb: 0, mar: 3, apr: 4, may: 6, jun: 5, jul: 3, aug: 3, sep: 2, oct: 5.5, nov: 2, dec: 0 },
          { brand: "Trafford", model: "Crossroads Season 3 Lantana", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 2, jul: 2.5, aug: 1, sep: 2, oct: 1, nov: 1, dec: 0 },
          { brand: "Panerai", model: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 4, oct: 5, nov: 4, dec: 0 },
          { brand: "Tag Heuer", model: "Carrera 5 Day Date", jan: 2, feb: 0, mar: 1, apr: 1, may: 0, jun: 0, jul: 1, aug: 3, sep: 1, oct: 0, nov: 0, dec: 0 },
        ],
        page3: [
          { brand: "Baltic", model: "Tricompax Tour Auto", price: "$2,100.00", movement: "Sellita SW510-M (manual)", powerReserve: "63h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "39mm", lugToLug: "47mm", waterResistance: "50m", caseback: "Solid, engraved Tour Auto decoration", band: "Leather strap" },
          { brand: "Breitling", model: "Navitimer GMT", price: "$6,200.00", movement: "Breitling Caliber 32 (ETA 2893-2 base, automatic GMT)", powerReserve: "42h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "41mm", lugToLug: "47mm", waterResistance: "30m", caseback: "Solid with engraving", band: "Leather/Stainless steel Bracelet" },
          { brand: "Breitling", model: "Superocean Heritage", price: "$5,400.00", movement: "Breitling B20 COSC (Tudor MT5612 base, automatic)", powerReserve: "70h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "42mm", lugToLug: "50mm", waterResistance: "200m", caseback: "Solid with engraving", band: "Rubber strap" },
          { brand: "Casio", model: "Databank", price: "$30.00", movement: "Casio Quartz Module", powerReserve: "Battery ~5 years", crystal: "Resin", caseMaterial: "Resin", caseSize: "35mm", lugToLug: "38mm", waterResistance: "30m", caseback: "Solid stainless steel back", band: "Resin strap" },
          { brand: "Longines", model: "Legend Diver Bronze", price: "$3,100.00", movement: "L888.5 (ETA A31.L11 base, automatic)", powerReserve: "72h", crystal: "Sapphire", caseMaterial: "Bronze", caseSize: "42mm", lugToLug: "52.6mm", waterResistance: "300m", caseback: "Solid titanium, engraving", band: "Leather strap/Nato" },
          { brand: "Swatch", model: "Moonswatch Earth", price: "$270.00", movement: "Quartz chronograph", powerReserve: "Battery ~2-3 years", crystal: "Bioplastic glass (plastic)", caseMaterial: "Bioceramic (plastic mix)", caseSize: "42mm", lugToLug: "47mm", waterResistance: "30m", caseback: "Solid with planet Earth print", band: "Velcro strap" },
          { brand: "Swatch", model: "Moonswatch Saturn", price: "$270.00", movement: "Quartz chronograph", powerReserve: "Battery ~2-3 years", crystal: "Bioplastic glass (plastic)", caseMaterial: "Bioceramic (plastic mix)", caseSize: "42mm", lugToLug: "47mm", waterResistance: "30m", caseback: "Solid with planet Saturn print", band: "Velcro strap" },
          { brand: "Omega", model: "Aqua Terra Beijing Winter Olympic Games 2022", price: "$6,700.00", movement: "Omega Caliber 8900 (automatic, METAS)", powerReserve: "60h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "41mm", lugToLug: "47.9mm", waterResistance: "150m", caseback: "Transparent sapphire, Olympic emblem decoration", band: "Stainless steel bracelet" },
          { brand: "Omega", model: "Speedmaster Moonwatch Pro (Sapphire)", price: "$8,000.00", movement: "Caliber 3861 (manual, Master Chronometer)", powerReserve: "50h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "42mm", lugToLug: "47.5mm", waterResistance: "50m", caseback: "Sapphire display back (NAIAD LOCK); exhibition view of Cal. 3861", band: "Stainless steel bracelet" },
          { brand: "Omega", model: "Speedmaster '57", price: "$10,700.00", movement: "Calibre 9906 (Manual, Master Chronometer, METAS)", powerReserve: "60h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "40.5mm", lugToLug: "49.64mm", waterResistance: "50m", caseback: "Sapphire display back; exhibition view of Cal. 9906", band: "Stainless steel bracelet" },
          { brand: "Omega", model: "Seamaster 300", price: "$5,900.00", movement: "Caliber 8800 (automatic, METAS)", powerReserve: "55h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "42mm", lugToLug: "50mm", waterResistance: "300m", caseback: "Sapphire display back (NAIAD LOCK); exhibition view of Cal. 8800", band: "Rubber strap/Stainless steel Bracelet" },
          { brand: "Oris", model: "Artelier Pointer Day Date", price: "$2,500.00", movement: "Oris Caliber 752 (SW220-1 base, automatic)", powerReserve: "38h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "40mm", lugToLug: "48mm", waterResistance: "50m", caseback: "Transparent sapphire, red rotor", band: "Bracelet" },
          { brand: "Oris", model: "Propilot Coulson Ltd Edition", price: "$4,700.00", movement: "Oris Caliber 400 (automatic, anti-magnetic)", powerReserve: "120h", crystal: "Sapphire", caseMaterial: "Carbon fiber", caseSize: "41mm", lugToLug: "49mm", waterResistance: "100m", caseback: "Titanium caseback/Transparent sapphire, Cal.400 visible", band: "Textile strap" },
          { brand: "IWC", model: "Mark XX", price: "$5,600.00", movement: "IWC Caliber 32111 (automatic)", powerReserve: "120h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "40mm", lugToLug: "50mm", waterResistance: "100m", caseback: "Solid, engraved plane motif", band: "Stainless steel bracelet" },
          { brand: "Trafford", model: "Crossroads Season 3 Lantana", price: "$700.00", movement: "Sellita SW200 (automatic)", powerReserve: "41h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "39mm", lugToLug: "47mm", waterResistance: "100m", caseback: "Transparent sapphire, custom decoration", band: "Leather strap" },
          { brand: "Panerai", model: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT", price: "$10,100.00", movement: "Panerai P.900/GMT", powerReserve: "72h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "40mm", lugToLug: "48mm", waterResistance: "100m", caseback: "Transparent sapphire", band: "Textile strap (rubber-backed fabric)/Rubber/Leather" },
          { brand: "Tag Heuer", model: "Carrera 5 Day Date", price: "$3,000.00", movement: "Caliber 5 (SW200-1 base, automatic)", powerReserve: "38h", crystal: "Sapphire", caseMaterial: "Stainless Steel", caseSize: "41mm", lugToLug: "48mm", waterResistance: "100m", caseback: "Transparent sapphire, decorated rotor", band: "Leather strap" },
        ],
        page4: [
          { brand: "Baltic", model: "Tricompax Tour Auto", whyBought: "I wanted a microbrand watch and liked the special edition one - I got this in March, but I waited until my birthday. My oldest son Liam said that was his gift to me.", whenBought: "March-24", whatILike: "The suede band and the classic chrono look and color scheme", whatIDontLike: "bad legibility - the chrono hand is a beautiful blue color and draws the attention making the other hands a bit hard to notice" },
          { brand: "Breitling", model: "Navitimer GMT", whyBought: "The watch representing 2024 - I wanted a GMT in my collection", whenBought: "October-24", whatILike: "Perfect size, confortable, beautiful color", whatIDontLike: "barely no water resistance" },
          { brand: "Breitling", model: "Superocean Heritage", whyBought: "The watch representing 2023 - My first Breitling - a brand that I wanted for many years a sign of success for me", whenBought: "October-23", whatILike: "The green and black bezel and shiny look but still very great to be a choice for a beach/pool day", whatIDontLike: "The tickness and lug to lug size" },
          { brand: "Casio", model: "Databank", whyBought: "I used to liked the databank when I was a kid", whenBought: "December-23", whatILike: "Just the memory of an old watch", whatIDontLike: "Cheap, looks like a toy, childish. My wife doesn't like this watch so I never wear" },
          { brand: "Longines", model: "Legend Diver Bronze", whyBought: "Christiamas 2023", whenBought: "December-23", whatILike: "The overall look on a bronze case and compressor, the field watch look on a nato strap", whatIDontLike: "The lug to lug size is bigger than I should wear" },
          { brand: "Swatch", model: "Moonswatch Earth", whyBought: "Sparked my love for collecting watches again", whenBought: "March-23", whatILike: "Fun watch", whatIDontLike: "Cheap, looks like a toy" },
          { brand: "Swatch", model: "Moonswatch Saturn", whyBought: "Sparked my love for collecting watches again", whenBought: "March-23", whatILike: "Fun watch", whatIDontLike: "Cheap, looks like a toy" },
          { brand: "Omega", model: "Aqua Terra Beijing Winter Olympic Games 2022", whyBought: "Winning the lottery 2025", whenBought: "March-25", whatILike: "Different white dial with cool details similar to snow reflection as this is a special edition and the blue hands", whatIDontLike: "It's a 41mm but looks bigger and I wish it was slimmer too" },
          { brand: "Omega", model: "Speedmaster Moonwatch Pro (Saphire)", whyBought: "After getting the Moonswatches, the speedy got my attention and became my dream watch", whenBought: "December-23", whatILike: "History behind it, a classic, movement and perfect 42mm watch. I am not fan of black dials and I feel that is the only one I need", whatIDontLike: "Boring watch - black dial isn't my favorite color but it's like a pair of black shoes - you need one." },
          { brand: "Omega", model: "Speedmaster '57", whyBought: "Christiamas 2025", whenBought: "November-25", whatILike: "Dial, movement, color, dial size", whatIDontLike: "Lug-to-lug could be smaller but still fit under 50mm" },
          { brand: "Omega", model: "Seamaster 300", whyBought: "My first diver watch and to celebrate new job at Apptio 2023", whenBought: "October-23", whatILike: "Beautiful dial and bezell, Unique asthetic diver", whatIDontLike: "It would be better if it was a 40 or 41 mm case and I like on a rubber strap more because the metal bracelet is heavy and too wide for my taste" },
          { brand: "ORIS", model: "Artelier Pointer Day Date", whyBought: "No emotional attachement. Nothing special - decided whileI I was in Mexico for a business trip as I wanted a Oris", whenBought: "February-24", whatILike: "The unique way showing date and bracelet comfort", whatIDontLike: "boring, power reserve and too reflective" },
          { brand: "ORIS", model: "Propilot Coulson Ltd Edition", whyBought: "Returning to my house Mar 24", whenBought: "January-25", whatILike: "The beautiful red/orange colors on the dial and case material. Very light watch on a perfect 41 mm size", whatIDontLike: "I don't like the clasp on the bracelet and the same time I like its uniqueness also makes harder for wear sometimes" },
          { brand: "IWC", model: "Mark XX", whyBought: "To celebrate my work performance in 2024", whenBought: "March-25", whatILike: "Color, size, thin, specs, perfect", whatIDontLike: "Nothing - perfect watch" },
          { brand: "Trafford", model: "Crossroads Season 3 Lantana", whyBought: "I liked the idea of a microbrand from Austin and the different style", whenBought: "March-25", whatILike: "Fun watch, color, unique design and confortable on the wrist", whatIDontLike: "specs and lack of versatility but that is the trade off when you have a unique piece" },
          { brand: "Panerai", model: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT", whyBought: "The watch representing 2025- I wanted a Panarai due to its unique style and history", whenBought: "25-Sep", whatILike: "Good case and lug to lug size, with an interesting look and easy bracelet or strap swap. Probably my seconf best watch, just behind the Mark XX", whatIDontLike: "The band Luna Rossa looks cool but isn't confortable" },
          { brand: "Tag Heuer", model: "Carrera 5 Day Date", whyBought: "My first Luxury Mechanical watch", whenBought: "Circa 2013", whatILike: "Classic look and old tag logo", whatIDontLike: "Thickness, long lugs, power reserve and leather strap" },
        ],
        page5: [
          { brand: "IWC", model: "Ingenieur", dialColors: "Blue or gray", rank: 1 },
          { brand: "Zenith", model: "El Primero chronograph", dialColors: "Blue or gray", rank: 2 },
          { brand: "Rolex", model: "datejust on a jubilee bracelet and fluted bezel", dialColors: "Green, blue or gray", rank: 3 },
          { brand: "Rolex", model: "Explorer I", dialColors: "Blue", rank: 4 },
          { brand: "Omega", model: "Speedmaster Snoopy", dialColors: "Silver", rank: 5 },
          { brand: "Cartier", model: "Santos Dumond (Medium or Large)", dialColors: "Green, blue or white", rank: 6 },
          { brand: "Longines", model: "Spirit Zulu Time 1925, GMT", dialColors: "black, golden bezel", rank: 7 },
        ],
      };

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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? "Importing..." : "Start Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
