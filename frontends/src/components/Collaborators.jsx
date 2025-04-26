"use client"

import { useState } from "react"
import "../styles/Collaborators.css"

const Collaborators = ({ collaborators = [], currentUser }) => {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)

  const handleInvite = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) return
    
    setInviting(true)
    
    // This would be implemented with the actual API
    try {
      // await api.post(`/projects/${projectId}/collaborators`, { email });
      console.log("Invited:", email)
      setEmail("")
      setShowInviteModal(false)
    } catch (err) {
      console.error("Error inviting collaborator:", err)
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="collaborators">
      <div className="collaborator-avatars">
        {/* Current user avatar */}
        <div className="collaborator-avatar current-user" title={currentUser?.name || "You"}>
          {currentUser?.name?.charAt(0) || "U"}
        </div>
        
        {/* Other collaborators */}
        {collaborators.map((collaborator) => (
          <div 
            key={collaborator.id} 
            className="collaborator-avatar" 
            title={collaborator.name}
            style={{ backgroundColor: collaborator.color }}
          >
            {collaborator.name.charAt(0)}
          </div>
        ))}
        
        {/* Add collaborator button */}
        <button 
          className="add-collaborator" 
          onClick={() => setShowInviteModal(true)}
          title="Invite collaborator"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal invite-modal">
            <div className="modal-header">
              <h2>Invite Collaborator</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowInviteModal(false)}
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleInvite}>
                <div className="form-group">
                  <label htmlFor="collaboratorEmail">Email</label>
                  <input
                    type="email"
                    id="collaboratorEmail"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter collaborator's email"
                    required
                  />
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={inviting || !email.trim()}
                  >
                    {inviting ? "Inviting..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Collaborators
