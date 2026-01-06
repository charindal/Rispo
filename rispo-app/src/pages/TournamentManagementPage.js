import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import clubService from '../services/clubService';
import authService from '../services/authService';
import '../styles/FormCard.css';

const TournamentManagementPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTournament, setEditingTournament] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        clubId: '',
        maxParticipants: '',
        venue: '',
        rules: '',
        format: 'SWISS'
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.userId;

    useEffect(() => {
        // Check if user is logged in
        if (!userId) {
            setError('Please log in to manage tournaments');
            return;
        }
        loadTournaments();
        loadClubs();
    }, [userId]);

    const loadTournaments = async () => {
        try {
            const response = await tournamentService.getAllTournaments();
            setTournaments(response.data);
        } catch (err) {
            setError('Failed to load tournaments');
        }
    };

    const loadClubs = async () => {
        try {
            const clubsData = await clubService.getActiveClubs();
            setClubs(clubsData);
        } catch (err) {
            console.error('Failed to load clubs:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!userId) {
            setError('Please log in to create or update tournaments');
            return;
        }

        const data = {
            ...formData,
            clubId: formData.clubId ? parseInt(formData.clubId) : null,
            maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
        };

        try {
            if (editingTournament) {
                await tournamentService.updateTournament(editingTournament.tournamentId, data, userId);
                setMessage('Tournament updated successfully');
            } else {
                await tournamentService.createTournament(data, userId);
                setMessage('Tournament created successfully');
            }
            
            resetForm();
            loadTournaments();
        } catch (err) {
            setError(err.response?.data || 'Operation failed');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            clubId: '',
            maxParticipants: '',
            venue: '',
            rules: '',
            format: 'SWISS'
        });
        setShowCreateForm(false);
        setEditingTournament(null);
    };

    const handleEdit = (tournament) => {
        setEditingTournament(tournament);
        setFormData({
            name: tournament.name,
            description: tournament.description || '',
            startDate: tournament.startDate || '',
            endDate: tournament.endDate || '',
            clubId: tournament.club?.clubId || '',
            maxParticipants: tournament.maxParticipants || '',
            venue: tournament.venue || '',
            rules: tournament.rules || '',
            format: tournament.format || 'SWISS'
        });
        setShowCreateForm(true);
    };

    const handlePublish = async (tournamentId) => {
        try {
            await tournamentService.publishTournament(tournamentId, userId);
            setMessage('Tournament published successfully');
            loadTournaments();
        } catch (err) {
            setError(err.response?.data || 'Failed to publish tournament');
        }
    };

    const handleDelete = async (tournamentId) => {
        if (!window.confirm('Are you sure you want to delete this tournament?')) return;
        
        try {
            await tournamentService.deleteTournament(tournamentId, userId);
            setMessage('Tournament deleted successfully');
            loadTournaments();
        } catch (err) {
            setError(err.response?.data || 'Failed to delete tournament');
        }
    };

    const handleGenerateMatches = async (tournamentId) => {
        if (!window.confirm('Generate matches for the next round? This will use Swiss pairing based on player ratings.')) {
            return;
        }

        setMessage('');
        setError('');

        try {
            const response = await tournamentService.generateTournamentMatches(tournamentId, null, userId);
            setMessage(response.data.message || `Generated ${response.data.matchCount} matches for round ${response.data.round}`);
            loadTournaments();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate matches');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            DRAFT: 'gray',
            PUBLISHED: 'blue',
            ONGOING: 'green',
            COMPLETED: 'purple',
            CANCELLED: 'red'
        };
        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: colors[status] || 'gray',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
                {status}
            </span>
        );
    };

    return (
        <div style={{ padding: '0', maxWidth: '100%', margin: '0' }}>
            {/* Navigation Bar */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 30px',
                backgroundColor: '#2c3e50',
                color: 'white',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>🏆 Tournament Management</h2>
                    <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#e74c3c',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {currentUser?.role?.replace('_', ' ') || 'Admin'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/admin-dashboard')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🏠 Admin Dashboard
                    </button>
                    {currentUser?.playerId && (
                        <button
                            onClick={() => navigate('/player-dashboard')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#9b59b6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🎱 Player Mode
                        </button>
                    )}
                    <button
                        onClick={() => { authService.logout(); navigate('/login'); }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Tournament Management</h1>

            {message && <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', marginBottom: '20px', borderRadius: '4px' }}>{message}</div>}
            {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '20px', borderRadius: '4px' }}>{error}</div>}

            <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '20px'
                }}
            >
                {showCreateForm ? 'Cancel' : 'Create New Tournament'}
            </button>

            {showCreateForm && (
                <div className="form-card" style={{ marginBottom: '30px' }}>
                    <h2>{editingTournament ? 'Edit Tournament' : 'Create Tournament'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Tournament Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label>Start Date *</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />
                            </div>
                            <div>
                                <label>End Date *</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label>Club (Optional)</label>
                                <select
                                    name="clubId"
                                    value={formData.clubId}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                >
                                    <option value="">-- No Club --</option>
                                    {clubs.map(club => (
                                        <option key={club.clubId} value={club.clubId}>
                                            {club.name} {club.city ? `(${club.city})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Tournament Format *</label>
                                <select
                                    name="format"
                                    value={formData.format}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                >
                                    <option value="SWISS">Swiss System</option>
                                    <option value="KNOCKOUT">Knockout (Elimination)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label>Max Participants</label>
                                <input
                                    type="number"
                                    name="maxParticipants"
                                    value={formData.maxParticipants}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />
                            </div>
                            <div>
                                <label>Venue</label>
                                <input
                                    type="text"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Rules</label>
                            <textarea
                                name="rules"
                                value={formData.rules}
                                onChange={handleInputChange}
                                rows="3"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="submit"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingTournament ? 'Update' : 'Create'}
                            </button>
                            <button 
                                type="button"
                                onClick={resetForm}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ marginTop: '30px' }}>
                <h2>All Tournaments</h2>
                {tournaments.length === 0 ? (
                    <p>No tournaments found.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Dates</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Format</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Participants</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Pending</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tournaments.map(tournament => (
                                <tr key={tournament.tournamentId}>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        {tournament.name}
                                        {tournament.club && <div style={{ fontSize: '12px', color: '#6c757d' }}>{tournament.club.clubName}</div>}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        {tournament.startDate} to {tournament.endDate}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            fontWeight: 'bold',
                                            color: tournament.format === 'KNOCKOUT' ? '#e83e8c' : '#17a2b8'
                                        }}>
                                            {tournament.format === 'KNOCKOUT' ? '🏆 Knockout' : '♟️ Swiss'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {getStatusBadge(tournament.status)}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {tournament.currentParticipants}{tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {tournament.pendingRequests}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => navigate(`/tournament-requests/${tournament.tournamentId}`)}
                                                style={{
                                                    padding: '5px 10px',
                                                    backgroundColor: '#17a2b8',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Requests
                                            </button>
                                            {(tournament.status === 'PUBLISHED' || tournament.status === 'ONGOING') && (
                                                <button
                                                    onClick={() => handleGenerateMatches(tournament.tournamentId)}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#6f42c1',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Generate Matches
                                                </button>
                                            )}
                                            {(tournament.status === 'PUBLISHED' || tournament.status === 'ONGOING' || tournament.status === 'COMPLETED') && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/tournament-matches/${tournament.tournamentId}`)}
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: '#20c997',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Matches
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/tournament-standings/${tournament.tournamentId}`)}
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: '#fd7e14',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Standings
                                                    </button>
                                                </>
                                            )}
                                            {tournament.status === 'DRAFT' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(tournament)}
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: '#ffc107',
                                                            color: 'black',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handlePublish(tournament.tournamentId)}
                                                        style={{
                                                            padding: '5px 10px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Publish
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(tournament.tournamentId)}
                                                style={{
                                                    padding: '5px 10px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            </div>
        </div>
    );
};

export default TournamentManagementPage;
