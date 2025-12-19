DO $$ BEGIN
 CREATE TYPE "rol_empresa" AS ENUM('dueño', 'contador_interno', 'auditor');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "rol_global" AS ENUM('admin', 'despacho', 'usuario');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "empresa_usuario_rol" (
	"empresa_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"rol" "rol_empresa" NOT NULL,
	"fecha_asignacion" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "empresa_usuario_rol_empresa_id_usuario_id_pk" PRIMARY KEY("empresa_id","usuario_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"razon_social" varchar(255) NOT NULL,
	"regimen_fiscal" varchar(10),
	"sector" varchar(50),
	"configuracion" jsonb,
	"fecha_alta" timestamp DEFAULT now() NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "empresas_rfc_unique" UNIQUE("rfc")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nombre_completo" varchar(100) NOT NULL,
	"rol_global" "rol_global" DEFAULT 'usuario' NOT NULL,
	"fecha_registro" timestamp DEFAULT now() NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "empresa_usuario_rol" ADD CONSTRAINT "empresa_usuario_rol_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "empresa_usuario_rol" ADD CONSTRAINT "empresa_usuario_rol_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
