import { useState } from "react";
import { PlusCircle, X, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AreaOfActivity, Company } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface AreasOfActivityManagerProps {
  contactId?: number;
  initialAreas?: Partial<AreaOfActivity>[];
  onChange: (areas: Partial<AreaOfActivity>[]) => void;
}

export default function AreasOfActivityManager({ 
  contactId, 
  initialAreas = [], 
  onChange 
}: AreasOfActivityManagerProps) {
  const [areas, setAreas] = useState<Partial<AreaOfActivity>[]>(initialAreas);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newArea, setNewArea] = useState<Partial<AreaOfActivity>>({
    contactId,
    companyName: "",
    role: "",
    jobDescription: "",
    isPrimary: false
  });

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: true
  });

  const handleAddArea = () => {
    // Assicuriamoci che l'area abbia tutti i campi necessari
    const areaToAdd = { 
      ...newArea, 
      contactId,
      // Se è una nuova azienda (companyId è null), il companyName deve essere specificato
      companyName: newArea.companyId ? (newArea.companyName || "") : (newArea.companyName || "")
    };
    
    console.log("Adding area with data:", areaToAdd);
    
    const updatedAreas = [...areas, areaToAdd];
    setAreas(updatedAreas);
    onChange(updatedAreas);
    
    // Reset the form
    setNewArea({
      contactId,
      companyName: "",
      role: "",
      jobDescription: "",
      isPrimary: false
    });
  };

  const handleUpdateArea = () => {
    if (editIndex === null) return;
    
    const updatedAreas = [...areas];
    updatedAreas[editIndex] = { ...newArea, contactId };
    
    setAreas(updatedAreas);
    onChange(updatedAreas);
    setEditIndex(null);
    setNewArea({
      contactId,
      companyName: "",
      role: "",
      jobDescription: "",
      isPrimary: false
    });
  };

  const handleRemoveArea = (index: number) => {
    const updatedAreas = areas.filter((_, i) => i !== index);
    setAreas(updatedAreas);
    onChange(updatedAreas);
  };

  const handleEditArea = (index: number) => {
    setEditIndex(index);
    setNewArea({ ...areas[index] });
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setNewArea({
      contactId,
      companyName: "",
      role: "",
      jobDescription: "",
      isPrimary: false
    });
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId === "new") {
      // Se si seleziona "new", si permette di inserire un nome azienda libero
      // ma si imposta companyId a null, indicando che è una nuova azienda
      setNewArea({
        ...newArea,
        companyId: null,
        // Manteniamo il companyName già inserito, se presente
        companyName: newArea.companyName || ""
      });
      console.log("Selected 'new company', area state:", {...newArea, companyId: null, companyName: newArea.companyName || ""});
    } else {
      // Se si seleziona un'azienda esistente, impostiamo sia l'ID che il nome
      const company = companies.find(c => c.id === parseInt(companyId));
      const updatedArea = {
        ...newArea,
        companyId: parseInt(companyId),
        companyName: company?.name || "",
      };
      setNewArea(updatedArea);
      console.log("Selected existing company, area state:", updatedArea);
    }
  };

  const handleSetPrimary = (index: number) => {
    const updatedAreas = areas.map((area, i) => ({
      ...area,
      isPrimary: i === index
    }));
    setAreas(updatedAreas);
    onChange(updatedAreas);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Areas of Activity</Label>
      </div>

      <div className="space-y-4">
        {areas.map((area, index) => (
          <Card key={index} className={`${editIndex === index ? 'border-primary' : ''}`}>
            <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {area.isPrimary && <Badge variant="outline" className="bg-primary/10 text-xs">Primary</Badge>}
                {area.companyName || (area.companyId && companies.find(c => c.id === area.companyId)?.name) || "Company not specified"}
              </CardTitle>
              <div className="flex space-x-2">
                {editIndex !== index && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditArea(index)}
                      className="h-8 px-2"
                    >
                      Edit
                    </Button>
                    {!area.isPrimary && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSetPrimary(index)}
                        className="h-8 px-2"
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveArea(index)}
                      className="h-8 px-2 text-destructive"
                    >
                      <X size={16} />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-2 px-4">
              {area.role && <p className="text-sm text-muted-foreground">Role: {area.role}</p>}
              {area.jobDescription && (
                <p className="text-sm mt-1">{area.jobDescription}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={editIndex !== null ? 'border-primary' : ''}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base font-medium">
            {editIndex !== null ? 'Edit Area of Activity' : 'Add New Area of Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select
              value={newArea.companyId?.toString() || "new"}
              onValueChange={handleCompanySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company or enter new one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Enter new company</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(!newArea.companyId || newArea.companyId === null) && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={newArea.companyName || ""}
                onChange={(e) => setNewArea({ ...newArea, companyName: e.target.value })}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={newArea.role || ""}
              onChange={(e) => setNewArea({ ...newArea, role: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              value={newArea.jobDescription || ""}
              onChange={(e) => setNewArea({ ...newArea, jobDescription: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isPrimary"
              checked={newArea.isPrimary || false}
              onCheckedChange={(checked) => setNewArea({ ...newArea, isPrimary: checked as boolean })}
            />
            <Label htmlFor="isPrimary" className="cursor-pointer">Set as primary area of activity</Label>
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3">
          {editIndex !== null ? (
            <div className="flex space-x-2">
              <Button onClick={handleCancelEdit} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleUpdateArea} disabled={!newArea.companyName && !newArea.companyId}>
                Update
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleAddArea} 
              disabled={!newArea.companyName && !newArea.companyId}
              className="gap-1"
            >
              <PlusCircle size={16} />
              Add Area
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}