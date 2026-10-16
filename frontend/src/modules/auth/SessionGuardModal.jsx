import React from 'react';

export const SessionGuardModal = ({ isOpen, reason, onTakeOver, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          padding: '2.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Ícono de Escudo / Seguridad */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 0 8px #fef2f2'
          }}
        >
          🛡️
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
          Sesión Activa en Otra Pestaña
        </h2>

        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
          {reason || 'Detectamos que tu cuenta ya está abierta en otra pestaña o ventana de este navegador. Por políticas de seguridad, no está permitido mantener dos instancias abiertas de la misma cuenta al mismo tiempo.'}
        </p>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#64748b',
            marginBottom: '1.75rem',
            textAlign: 'left'
          }}
        >
          🔒 <strong>Medida de seguridad:</strong> Cada cuenta cuenta con un token de sesión exclusivo. Puedes elegir continuar en esta pestaña (lo cual transferirá tu sesión y desconectará la otra) o cerrar la sesión.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '0.85rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={onTakeOver}
          >
            Usar en esta pestaña (Transferir sesión)
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '0.95rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
