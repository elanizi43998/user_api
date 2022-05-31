/*
  Warnings:

  - A unique constraint covering the columns `[nom,model]` on the table `Car` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Car_nom_model_key` ON `Car`(`nom`, `model`);
