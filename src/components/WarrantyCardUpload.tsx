import { useState } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WarrantyInfo {
  warranty_date: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  warranty_period?: string;
  retailer?: string;
  additional_info?: string;
}

interface WarrantyCardUploadProps {
  onExtracted: (info: WarrantyInfo) => void;
}

export const WarrantyCardUpload = ({ onExtracted }: WarrantyCardUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processImage = async (file: File) => {
    try {
      setIsProcessing(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;
        setPreview(base64Image);

        try {
          const { data, error } = await supabase.functions.invoke('extract-warranty-info', {
            body: { image: base64Image }
          });

          if (error) throw error;

          toast.success('Warranty information extracted successfully!');
          onExtracted(data);
        } catch (error: any) {
          console.error('Error extracting warranty info:', error);
          if (error.message?.includes('Rate limit')) {
            toast.error('Rate limit exceeded. Please try again later.');
          } else if (error.message?.includes('quota')) {
            toast.error('AI usage quota exceeded. Please add credits.');
          } else {
            toast.error('Failed to extract warranty information');
          }
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    processImage(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Upload Warranty Card
        </CardTitle>
        <CardDescription>
          Upload a photo of your warranty card to automatically extract information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview && (
          <div className="rounded-lg overflow-hidden border">
            <img 
              src={preview} 
              alt="Warranty card preview" 
              className="w-full h-48 object-contain bg-muted"
            />
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
            onClick={() => document.getElementById('warranty-file-input')?.click()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Select Image
              </>
            )}
          </Button>
          <input
            id="warranty-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, WEBP (max 10MB)
        </p>
      </CardContent>
    </Card>
  );
};
