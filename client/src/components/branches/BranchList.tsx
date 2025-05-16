import { useState } from "react";
import { useLocation } from "wouter";
import { Branch } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { 
  Eye, Trash, Edit, Globe, Phone, Mail, MapPin, Building
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useBranches } from "@/hooks/useBranches";

interface BranchListProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
}

export default function BranchList({ branches, onEdit }: BranchListProps) {
  const [_, navigate] = useLocation();
  const { deleteBranch } = useBranches();

  // Handle delete branch
  const handleDelete = async (id: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questa filiale?")) {
      deleteBranch.mutate(id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {branches.map((branch) => (
        <Card key={branch.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold mb-1">{branch.name}</h3>
                <div className="flex items-center">
                  {branch.type && (
                    <Badge variant="outline" className="mr-2">
                      {branch.type}
                    </Badge>
                  )}
                  {branch.isHeadquarters && (
                    <Badge variant="secondary" className="text-xs">
                      Sede Principale
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(branch)}>
                    Modifica Filiale
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(branch.id)}
                  >
                    Elimina Filiale
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="space-y-2">
                  {branch.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={`mailto:${branch.email}`}
                        className="hover:underline truncate max-w-[200px]"
                      >
                        {branch.email}
                      </a>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {branch.address && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{branch.address}</span>
                    </div>
                  )}
                  
                  {branch.companyName && (
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{branch.companyName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              Creata il {formatDate(branch.createdAt)}
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/branches/${branch.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" /> Vedi Dettagli
              </Button>
              <Button 
                size="sm"
                onClick={() => branch.email ? window.location.href = `mailto:${branch.email}` : null}
                disabled={!branch.email}
              >
                <Mail className="h-4 w-4 mr-1" /> Contatta
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}