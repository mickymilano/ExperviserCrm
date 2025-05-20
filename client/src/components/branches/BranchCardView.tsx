import { Branch } from "../../types";
import {
  Card,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { formatDate } from "../../lib/utils";
import { Eye, Phone, Mail, Calendar, MapPin } from "lucide-react";
import { useLocation } from "wouter";

interface BranchCardViewProps {
  branch: Branch;
  onEdit?: (branch: Branch) => void;
}

export default function BranchCardView({ branch, onEdit }: BranchCardViewProps) {
  const [_, navigate] = useLocation();

  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{branch.name}</h3>
              {branch.companyName && (
                <p className="text-blue-600 text-sm mb-2">{branch.companyName}</p>
              )}
            </div>
            <div className="flex items-center">
              {branch.type && (
                <Badge variant="outline" className="ml-2">
                  {branch.type}
                </Badge>
              )}
              {branch.isHeadquarters && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Sede Principale
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2 flex-grow">
            {branch.address && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">{branch.address}</span>
              </div>
            )}
            
            {branch.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <a
                  href={`mailto:${branch.email}`}
                  className="hover:underline truncate"
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

          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Creata il {formatDate(branch.createdAt)}
            </div>
          </div>

          <div className="flex justify-between mt-3 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="px-2 h-8"
              onClick={() => navigate(`/branches/${branch.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" /> Dettagli
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="px-2 h-8"
              onClick={() => branch.email ? window.location.href = `mailto:${branch.email}` : null}
              disabled={!branch.email}
            >
              <Mail className="h-4 w-4 mr-1" /> Contatta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}