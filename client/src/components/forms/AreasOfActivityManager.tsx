import { useState, useEffect } from "react";
import { PlusCircle, X, Check, AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AreaOfActivity, Company } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();
  const [areas, setAreas] = useState<Partial<AreaOfActivity>[]>(initialAreas);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newArea, setNewArea] = useState<Partial<AreaOfActivity>>({
    contactId,
    companyName: "",
    role: "",
    jobDescription: "",
    isPrimary: false,
    branchId: null
  });

  // Reset the form when contactId changes
  useEffect(() => {
    console.log(`ContactId in AreasOfActivityManager changed to: ${contactId}`);
    setNewArea(prev => ({
      ...prev,
      contactId,
      branchId: prev.branchId || null
    }));
  }, [contactId]);

  // Reset areas when initialAreas changes
  useEffect(() => {
    console.log(`initialAreas in AreasOfActivityManager changed:`, initialAreas);
    setAreas(initialAreas);
  }, [initialAreas]);

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: true
  });

  // Fetch branches for the selected company
  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches/company", newArea.companyId],
    enabled: !!newArea.companyId,
  });

  console.log("Available companies:", companies.map(c => `${c.id}: ${c.name}`).join(", "));
  console.log("Available branches for company", newArea.companyId, ":", branches);

  const validateArea = (area: Partial<AreaOfActivity>): boolean => {
    setError(null);
    
    // Se non abbiamo un companyId, dobbiamo avere un companyName
    if (!area.companyId && !area.companyName) {
      setError("Please select a company or enter a new company name");
      return false;
    }
    
    // Se abbiamo un companyId, verifichiamo che esista
    if (area.companyId && !companies.some(c => c.id === area.companyId)) {
      setError(`Invalid company ID: ${area.companyId}`);
      return false;
    }
    
    return true;
  };

  const handleAddArea = () => {
    // Validate the area before adding
    if (!validateArea(newArea)) {
      toast({
        title: "Validation Error",
        description: error || "Please check the company information",
        variant: "destructive"
      });
      return;
    }
    
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
      isPrimary: false,
      branchId: null
    });
    
    // Show success toast
    toast({
      title: "Company Added",
      description: `Added ${areaToAdd.companyName || "company"} to contact`,
    });
  };

  const handleUpdateArea = () => {
    if (editIndex === null) return;
    
    // Validate the area before updating
    if (!validateArea(newArea)) {
      toast({
        title: "Validation Error",
        description: error || "Please check the company information",
        variant: "destructive"
      });
      return;
    }
    
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
    
    // Show success toast
    toast({
      title: "Company Updated",
      description: `Updated company information`,
    });
  };

  const handleRemoveArea = (index: number) => {
    const areaToRemove = areas[index];
    const companyInfo = areaToRemove.companyId 
      ? companies.find(c => c.id === areaToRemove.companyId)?.name 
      : areaToRemove.companyName;
      
    const updatedAreas = areas.filter((_, i) => i !== index);
    setAreas(updatedAreas);
    onChange(updatedAreas);
    
    // Show success toast
    toast({
      title: "Company Removed",
      description: `Removed ${companyInfo || "company"} from contact`,
    });
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
      isPrimary: false,
      branchId: null
    });
    setError(null);
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId === "new") {
      // Se si seleziona "new", si permette di inserire un nome azienda libero
      // ma si imposta companyId a null, indicando che è una nuova azienda
      setNewArea({
        ...newArea,
        companyId: null,
        branchId: null, // Reset branch quando si seleziona nuova azienda
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
        branchId: null, // Reset branch quando si cambia azienda
      };
      setNewArea(updatedArea);
      console.log("Selected existing company, area state:", updatedArea);
    }
    
    // Clear any previous error
    setError(null);
  };

  const handleSetPrimary = (index: number) => {
    const updatedAreas = areas.map((area, i) => ({
      ...area,
      isPrimary: i === index
    }));
    setAreas(updatedAreas);
    onChange(updatedAreas);
    
    // Show success toast
    const primaryCompany = updatedAreas[index].companyId 
      ? companies.find(c => c.id === updatedAreas[index].companyId)?.name 
      : updatedAreas[index].companyName;
      
    toast({
      title: "Primary Company Set",
      description: `Set ${primaryCompany || "company"} as primary company`,
    });
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
              {area.branchId && (
                <p className="text-sm text-muted-foreground">
                  Filiale: {branches.find(b => b.id === area.branchId)?.name || ""}
                </p>
              )}
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
          
          {newArea.companyId && branches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="branch">Filiale</Label>
              <Select
                value={newArea.branchId?.toString() || ""}
                onValueChange={(branchId) => setNewArea({ ...newArea, branchId: branchId ? parseInt(branchId) : null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una filiale (opzionale)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessuna filiale specifica</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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