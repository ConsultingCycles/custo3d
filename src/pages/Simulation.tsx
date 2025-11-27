import React from 'react';
import { NewPrint } from './NewPrint';

export const Simulation = () => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-yellow-200 mb-6">
        <strong>Modo Simulação:</strong> Os cálculos feitos aqui são idênticos aos da tela de Nova Impressão, mas nada será salvo no banco de dados. Ideal para orçamentos rápidos.
      </div>
      <NewPrint isSimulation={true} />
    </div>
  );
};
