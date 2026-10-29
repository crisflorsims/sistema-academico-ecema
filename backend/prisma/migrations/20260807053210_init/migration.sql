-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'DOCENTE', 'CURSANTE');

-- CreateEnum
CREATE TYPE "TipoDiplomado" AS ENUM ('ANUAL', 'SEMESTRAL');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVO', 'EGRESADO', 'ABANDONO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "foto_url" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CURSANTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Periodo" (
    "id" SERIAL NOT NULL,
    "gestion" TEXT NOT NULL,
    "semestre" TEXT,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),

    CONSTRAINT "Periodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diplomado" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoDiplomado" NOT NULL DEFAULT 'ANUAL',
    "duracion" TEXT,

    CONSTRAINT "Diplomado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "creditos" INTEGER,
    "horas" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "diplomado_id" INTEGER NOT NULL,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocenteMateria" (
    "id" SERIAL NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "materia_id" INTEGER NOT NULL,

    CONSTRAINT "DocenteMateria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdicionDiplomado" (
    "id" SERIAL NOT NULL,
    "diplomado_id" INTEGER NOT NULL,
    "periodo_id" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',

    CONSTRAINT "EdicionDiplomado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" SERIAL NOT NULL,
    "cursante_id" INTEGER NOT NULL,
    "edicion_id" INTEGER NOT NULL,
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionMateria" (
    "id" SERIAL NOT NULL,
    "inscripcion_id" INTEGER NOT NULL,
    "materia_id" INTEGER NOT NULL,

    CONSTRAINT "InscripcionMateria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" SERIAL NOT NULL,
    "inscripcion_materia_id" INTEGER NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "evaluacion" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionInstituto" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "ConfiguracionInstituto_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Periodo_gestion_semestre_key" ON "Periodo"("gestion", "semestre");

-- CreateIndex
CREATE UNIQUE INDEX "DocenteMateria_docente_id_materia_id_key" ON "DocenteMateria"("docente_id", "materia_id");

-- CreateIndex
CREATE UNIQUE INDEX "EdicionDiplomado_diplomado_id_periodo_id_key" ON "EdicionDiplomado"("diplomado_id", "periodo_id");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_cursante_id_edicion_id_key" ON "Inscripcion"("cursante_id", "edicion_id");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionMateria_inscripcion_id_materia_id_key" ON "InscripcionMateria"("inscripcion_id", "materia_id");

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_diplomado_id_fkey" FOREIGN KEY ("diplomado_id") REFERENCES "Diplomado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteMateria" ADD CONSTRAINT "DocenteMateria_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteMateria" ADD CONSTRAINT "DocenteMateria_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdicionDiplomado" ADD CONSTRAINT "EdicionDiplomado_diplomado_id_fkey" FOREIGN KEY ("diplomado_id") REFERENCES "Diplomado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdicionDiplomado" ADD CONSTRAINT "EdicionDiplomado_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "Periodo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_cursante_id_fkey" FOREIGN KEY ("cursante_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_edicion_id_fkey" FOREIGN KEY ("edicion_id") REFERENCES "EdicionDiplomado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionMateria" ADD CONSTRAINT "InscripcionMateria_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "Inscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionMateria" ADD CONSTRAINT "InscripcionMateria_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_inscripcion_materia_id_fkey" FOREIGN KEY ("inscripcion_materia_id") REFERENCES "InscripcionMateria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
