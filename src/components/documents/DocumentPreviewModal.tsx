
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface DocumentPreviewModalProps {
  document: any;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (document: any) => void;
}

export function DocumentPreviewModal({ document, isOpen, onClose, onDownload }: DocumentPreviewModalProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {document.description}
          </div>
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Preview não disponível para este tipo de arquivo
            </p>
            <Button onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Documento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
