

import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Trip, Event, Document as DocType } from '../../types';
import { useData } from '../../context/DataContext';
import { useItinerary } from '../../context/ItineraryContext';

const DocumentViewerModal = lazy(() => import('../common/DocumentViewerModal'));

const getIconForMimeType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    return 'description';
};

const DocumentHub: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { addDocument, deleteDocument } = useData();
    const { getEventsByTrip } = useItinerary();
    const [viewingDocument, setViewingDocument] = useState<DocType | null>(null);

    const documents = useMemo(() => trip.documents || [], [trip.documents]);
    const events = useMemo(() => getEventsByTrip(trip.id), [getEventsByTrip, trip.id]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        // FIX: Replaced for...of loop with a standard for loop to iterate over the FileList.
        // This resolves TypeScript type inference issues where `file` was incorrectly typed as `unknown`
        // within the asynchronous `reader.onload` callback, fixing errors related to property access
        // and argument types. This also resolves the cascading type error later in the file.
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    addDocument(trip.id, {
                        tripId: trip.id,
                        name: file.name,
                        type: file.type,
                        data: loadEvent.target.result as string,
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const documentsByEvent = useMemo(() => {
        const grouped: { [eventId: string]: DocType[] } = {};
        const unassigned: DocType[] = [];

        documents.forEach(doc => {
            if (doc.eventId && events.find(e => e.eventId === doc.eventId)) {
                if (!grouped[doc.eventId]) grouped[doc.eventId] = [];
                grouped[doc.eventId].push(doc);
            } else {
                unassigned.push(doc);
            }
        });

        return { grouped, unassigned };
    }, [documents, events]);

    const DocumentItem: React.FC<{ doc: DocType }> = ({ doc }) => (
        <div className="flex items-center gap-3 p-3 bg-surface-variant/50 rounded-2xl">
            <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">{getIconForMimeType(doc.type)}</span>
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-on-surface truncate">{doc.name}</p>
                <p className="text-xs text-on-surface-variant">{doc.type}</p>
            </div>
            <div className="flex-shrink-0">
                <button onClick={() => setViewingDocument(doc)} className="p-2 text-on-surface-variant hover:text-primary rounded-full transition-colors"><span className="material-symbols-outlined">visibility</span></button>
                <button onClick={() => deleteDocument(trip.id, doc.id)} className="p-2 text-on-surface-variant hover:text-error rounded-full transition-colors"><span className="material-symbols-outlined">delete</span></button>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-6 pb-20">
            <div>
                 <label htmlFor="doc-upload" className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-outline/50 rounded-3xl cursor-pointer hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-5xl text-primary">cloud_upload</span>
                    <span className="text-lg font-semibold text-primary">Carica Documenti</span>
                    <span className="text-sm text-on-surface-variant">Trascina qui i file o clicca per selezionare</span>
                </label>
                <input id="doc-upload" type="file" multiple onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
            </div>

            {Object.keys(documentsByEvent.grouped).length === 0 && documentsByEvent.unassigned.length === 0 ? (
                 <div className="text-center py-12 px-4 bg-surface-variant/50 rounded-3xl">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">folder_off</span>
                    <p className="font-semibold text-on-surface-variant text-lg">Nessun documento</p>
                    <p className="text-sm text-on-surface-variant/80 mt-1">Carica biglietti, prenotazioni e visti qui.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(documentsByEvent.grouped).map(([eventId, docs]) => {
                        const event = events.find(e => e.eventId === eventId);
                        return (
                            <div key={eventId}>
                                <h3 className="font-bold text-on-surface mb-2">{event?.title || 'Evento Sconosciuto'}</h3>
                                <div className="space-y-2">
                                    {/* FIX: Cast `docs` to DocType[] to resolve TypeScript error where it's inferred as 'unknown'. */}
                                    {(docs as DocType[]).map(doc => <DocumentItem key={doc.id} doc={doc} />)}
                                </div>
                            </div>
                        );
                    })}

                    {documentsByEvent.unassigned.length > 0 && (
                         <div>
                            <h3 className="font-bold text-on-surface mb-2">Generali</h3>
                            <div className="space-y-2">
                                {documentsByEvent.unassigned.map(doc => <DocumentItem key={doc.id} doc={doc} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
             {viewingDocument && (
                <Suspense fallback={<div/>}>
                    <DocumentViewerModal document={viewingDocument} onClose={() => setViewingDocument(null)} />
                </Suspense>
            )}
        </div>
    );
};

export default DocumentHub;