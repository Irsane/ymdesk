import React from 'react'
import { createPortal } from 'react-dom'
import VkAuthForm from './VkAuthForm.jsx'
import { IconClose } from './Icons.jsx'

export default function ConnectVk({ onClose, onConnected }) {
  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Подключить VK Музыку">
        <div className="modal-head">
          <h3 className="modal-title">Подключить VK Музыку</h3>
          <button className="icon-btn" onClick={onClose} title="Закрыть"><IconClose size={18} /></button>
        </div>
        <div className="modal-body">
          <VkAuthForm onConnected={onConnected} />
        </div>
      </div>
    </div>,
    document.body
  )
}
