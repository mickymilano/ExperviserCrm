import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Company } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LinkCompanyButtonProps {
  contactId: number;
  onSuccess?: () => void;
}

export function LinkCompanyButton({ contactId, onSuccess }: LinkCompanyButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: true,
  });

  const handleLinkCompany = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Error",
        description: "Please select a company to link",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Linking contact ${contactId} to company ${selectedCompanyId}`);
      
      const response = await fetch(
        `/api/contacts/${contactId}/companies/${selectedCompanyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            jobDescription,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to link company");
      }

      const data = await response.json();
      console.log("Link successful:", data);

      // Invalidate relevant queries with more effective pattern that matches queries with parameters too
      queryClient.invalidateQueries({ queryKey: [[`/api/contacts/${contactId}`]] });
      queryClient.invalidateQueries({ queryKey: [[`/api/contacts/${contactId}/companies`]] });
      queryClient.invalidateQueries({ queryKey: [[`/api/contacts/${contactId}/areas-of-activity`]] });
      queryClient.invalidateQueries({ queryKey: [[`/api/contacts`]] }); // Invalidate all contacts queries
      
      // Invalidate company data
      queryClient.invalidateQueries({ queryKey: [[`/api/companies/${selectedCompanyId}`]] });
      queryClient.invalidateQueries({ queryKey: [[`/api/companies/${selectedCompanyId}/contacts`]] });

      toast({
        title: "Success",
        description: "Company linked successfully",
      });

      setOpen(false);
      setSelectedCompanyId("");
      setRole("");
      setJobDescription("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error linking company:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to link company",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-2">
          Link to Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link to Company</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jobDescription" className="text-right">
              Job Description
            </Label>
            <Input
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleLinkCompany} disabled={isLoading}>
            {isLoading ? "Linking..." : "Link Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}