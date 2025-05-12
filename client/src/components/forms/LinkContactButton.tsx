import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
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

interface LinkContactButtonProps {
  companyId: number;
  onSuccess?: () => void;
}

export function LinkContactButton({ companyId, onSuccess }: LinkContactButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Fetch contacts for dropdown
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: true,
  });

  const handleLinkContact = async () => {
    if (!selectedContactId) {
      toast({
        title: "Error",
        description: "Please select a contact to link",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Linking contact ${selectedContactId} to company ${companyId}`);
      
      const response = await fetch(
        `/api/contacts/${selectedContactId}/companies/${companyId}`,
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
        throw new Error(errorData.message || "Failed to link contact");
      }

      const data = await response.json();
      console.log("Link successful:", data);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contacts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${selectedContactId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${selectedContactId}/areas-of-activity`] });

      toast({
        title: "Success",
        description: "Contact linked successfully",
      });

      setOpen(false);
      setSelectedContactId("");
      setRole("");
      setJobDescription("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error linking contact:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to link contact",
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
          Link to Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link to Contact</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">
              Contact
            </Label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id.toString()}>
                    {contact.firstName} {contact.lastName}
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
          <Button type="submit" onClick={handleLinkContact} disabled={isLoading}>
            {isLoading ? "Linking..." : "Link Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}