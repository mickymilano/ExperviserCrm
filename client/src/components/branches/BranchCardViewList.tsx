import { Branch } from "@/types";
import BranchCardView from "./BranchCardView";

interface BranchCardViewListProps {
  branches: Branch[];
  onEdit?: (branch: Branch) => void;
}

export default function BranchCardViewList({ branches, onEdit }: BranchCardViewListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {branches.map((branch) => (
        <BranchCardView 
          key={branch.id} 
          branch={branch} 
          onEdit={onEdit} 
        />
      ))}
    </div>
  );
}