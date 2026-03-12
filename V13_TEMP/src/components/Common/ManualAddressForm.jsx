import React, { useState } from 'react';
import css from './ManualAddressForm.module.css';

const ManualAddressForm = ({ onSubmit, initialAddress }) => {
    const [formData, setFormData] = useState({
        houseStreet: '',
        areaLandmark: '',
        townCity: 'Mahalingapura',
        pinCode: '587312'
    });
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.houseStreet.trim() || !formData.areaLandmark.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            // Step 1: Geocode the address
            const geocodeResponse = await fetch('/api/address/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const geocoded = await geocodeResponse.json();

            // Step 2: Validate the geocoded address
            const fullAddress = `${formData.houseStreet}, ${formData.areaLandmark}, ${formData.townCity}, ${formData.pinCode}`;

            const validateResponse = await fetch('/api/address/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    addressType: 'manual',
                    ...formData,
                    latitude: geocoded.latitude,
                    longitude: geocoded.longitude,
                    googleFormattedAddress: geocoded.googleFormattedAddress,
                    fullAddress: fullAddress
                })
            });

            const validation = await validateResponse.json();

            if (validation.valid) {
                onSubmit(validation.address);
            } else {
                setError(validation.message);
            }
        } catch (error) {
            console.error('Address validation error:', error);
            setError('Failed to validate address. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className={css.manualAddressForm}>
            <form onSubmit={handleSubmit}>
                <div className={css.formGroup}>
                    <label>House / Street Number *</label>
                    <input
                        type="text"
                        name="houseStreet"
                        value={formData.houseStreet}
                        onChange={handleChange}
                        placeholder="e.g., 123 Main Street, Flat 4B"
                        required
                    />
                </div>

                <div className={css.formGroup}>
                    <label>Area / Landmark *</label>
                    <input
                        type="text"
                        name="areaLandmark"
                        value={formData.areaLandmark}
                        onChange={handleChange}
                        placeholder="e.g., Near Town Hall, Behind Market"
                        required
                    />
                </div>

                <div className={css.formRow}>
                    <div className={css.formGroup}>
                        <label>Town / City *</label>
                        <input
                            type="text"
                            name="townCity"
                            value={formData.townCity}
                            onChange={handleChange}
                            placeholder="Mahalingapura"
                            required
                        />
                        <small>Valid: Mahalingapura, Mahalingpur, MLP</small>
                    </div>

                    <div className={css.formGroup}>
                        <label>PIN Code *</label>
                        <input
                            type="text"
                            name="pinCode"
                            value={formData.pinCode}
                            onChange={handleChange}
                            placeholder="587312"
                            pattern="[0-9]{6}"
                            maxLength="6"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className={css.errorMessage}>
                        ⚠️ {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isValidating}
                    className={css.submitBtn}
                >
                    {isValidating ? (
                        <>
                            <span className={css.spinner}></span>
                            Validating...
                        </>
                    ) : (
                        'Validate & Use This Address'
                    )}
                </button>
            </form>

            <div className={css.helpText}>
                <p>💡 <strong>Tip:</strong> We deliver only within Mahalingapura (PIN 587312)</p>
                <p>You can order for someone else even if you're outside the delivery area.</p>
            </div>
        </div>
    );
};

export default ManualAddressForm;
