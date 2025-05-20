import { useState } from "react";
import { StageSummary } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { formatCurrency } from "../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface DealPipelineProps {
  dealsByStage?: StageSummary[];
}

type TimeFrame = "Week" | "Month" | "Quarter";
type DealAgeType = "Recent" | "Oldest";

export default function DealPipeline({ dealsByStage }: DealPipelineProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("Month");
  const [dealFilter, setDealFilter] = useState<DealAgeType>("Recent");
  
  if (!dealsByStage) return null;
  
  const totalDeals = dealsByStage.reduce((acc, stageData) => acc + stageData.count, 0);
  const totalValue = dealsByStage.reduce((acc, stageData) => acc + stageData.value, 0);
  
  // Calculate cumulative progress for the pipeline progress bar
  let cumulativeProgress = 0;
  const progressWeight = 100 / dealsByStage.length;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">Pipeline Opportunità</CardTitle>
            <Select value={dealFilter} onValueChange={(value) => setDealFilter(value as DealAgeType)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Filtra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Recent">Più recenti</SelectItem>
                <SelectItem value="Oldest">Più vecchie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={timeFrame === "Week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("Week")}
              className={`text-sm py-1 ${timeFrame === "Week" ? "bg-primary-light" : "bg-neutral-lightest hover:bg-neutral-light text-neutral-dark"}`}
            >
              Settimana
            </Button>
            <Button
              variant={timeFrame === "Month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("Month")}
              className={`text-sm py-1 ${timeFrame === "Month" ? "bg-primary-light" : "bg-neutral-lightest hover:bg-neutral-light text-neutral-dark"}`}
            >
              Mese
            </Button>
            <Button
              variant={timeFrame === "Quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("Quarter")}
              className={`text-sm py-1 ${timeFrame === "Quarter" ? "bg-primary-light" : "bg-neutral-lightest hover:bg-neutral-light text-neutral-dark"}`}
            >
              Trimestre
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto pb-4">
          <div className="min-w-max">
            {/* Pipeline Stages */}
            <div className="flex justify-between space-x-1 mb-4">
              {dealsByStage.map((stageData) => {
                cumulativeProgress += progressWeight;
                return (
                  <div 
                    key={stageData.stage.id} 
                    className="flex-1 min-w-[120px] bg-neutral-lightest rounded p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">{stageData.stage.name}</h4>
                      <span className="text-xs font-semibold bg-blue-100 text-primary px-2 py-0.5 rounded">
                        {stageData.count}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-medium">{formatCurrency(stageData.value)}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar */}
            <Progress value={65} className="h-2 mb-4" />
            
            {/* Pipeline Stats */}
            <div className="flex justify-between text-xs text-neutral-medium">
              <span>Totale Opportunità: {totalDeals}</span>
              <span>Valore Totale: {formatCurrency(totalValue)}</span>
              <span>Tempo Medio Chiusura: 42 giorni</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
