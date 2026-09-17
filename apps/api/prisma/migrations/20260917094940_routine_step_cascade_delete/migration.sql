-- DropForeignKey
ALTER TABLE "RoutineStep" DROP CONSTRAINT "RoutineStep_routineId_fkey";

-- AddForeignKey
ALTER TABLE "RoutineStep" ADD CONSTRAINT "RoutineStep_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
