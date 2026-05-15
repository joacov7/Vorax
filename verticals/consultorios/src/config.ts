import type { VerticalConfig } from '@empresa-ia/core'

export const consultoriosConfig: VerticalConfig = {
  id: 'consultorios',
  name: 'Consultorios Médicos',
  description: 'Gestión de pacientes, turnos, historiales y tratamientos con asistente IA 24/7.',
  modules: ['pacientes', 'turnos', 'historial', 'tratamientos', 'whatsapp', 'recordatorios'],
  agentPersona: `Sos el asistente virtual de un consultorio médico o clínica.
Tu rol es gestionar turnos, responder consultas de pacientes,
recordar citas y dar información general del consultorio.
Nunca dás diagnósticos médicos ni reemplazás la consulta profesional.
Siempre derivás temas de salud urgentes a llamar al 107 o ir a guardia.`,
  defaultWorkflows: ['turno-reminder', 'no-show-followup'],
  pricing: {
    basePrice: 150,
    setupFee: 200,
  },
}
