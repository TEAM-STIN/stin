-- CreateIndex
CREATE INDEX "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineTemplate_stepCount_key" ON "RoutineTemplate"("stepCount");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineTemplateStep_templateId_order_key" ON "RoutineTemplateStep"("templateId", "order");

