'use client'

import Modal from "@/components/ui/modal";
import { Folder, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAddRequestToCollection } from "@/modules/request/hooks/request";
import { REST_METHOD } from "@prisma/client";
import { useWorkspaceStore } from "@/modules/Layout/store";
import { useCollections } from "../hooks/collections";

const SaveRequestToCollectionModal = ({
  isModalOpen,
  setIsModalOpen,
  requestData = {
    name: "Untitled",
    url: "",
    method: REST_METHOD.GET,
  },
  initialName = "Untitled",
  collectionId
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  requestData?: {
    name: string;
    method: REST_METHOD;
    url: string;
  };
  initialName?: string;
  collectionId?: string
}) => {
  const [requestName, setRequestName] = useState(initialName);
  const [requestUrl, setRequestUrl] = useState(requestData.url || "");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collectionId || "");
  const [searchTerm, setSearchTerm] = useState("");

  const { selectedWorkspace } = useWorkspaceStore();
  const { data: collections, isLoading, isError } = useCollections(selectedWorkspace?.id!);
  const { mutateAsync, isPending } = useAddRequestToCollection(selectedCollectionId);

  useEffect(() => {
    if (isModalOpen) {
      setRequestName(requestData.name || initialName);
      setRequestUrl(requestData.url || "");
      setSelectedCollectionId(collectionId || "");
      setSearchTerm("");
    }
  }, [isModalOpen, requestData.name, requestData.url, initialName, collectionId]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (collectionId) return;
    if (!selectedCollectionId && collections && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [isModalOpen, collections, collectionId, selectedCollectionId]);

  const requestColorMap: Record<REST_METHOD, string> = {
    [REST_METHOD.GET]: "text-green-500",
    [REST_METHOD.POST]: "text-indigo-500",
    [REST_METHOD.PUT]: "text-yellow-500",
    [REST_METHOD.DELETE]: "text-red-500",
    [REST_METHOD.PATCH]: "text-orange-500",
  };

  const filteredCollections = collections?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedCollection = collections?.find(c => c.id === selectedCollectionId);

  const handleSubmit = async () => {
    if (!requestName.trim()) return toast.error("Please enter a request name");
    if (!requestUrl.trim()) return toast.error("Please enter a request URL");
    if (!selectedCollectionId) return toast.error("Please select a collection");

    try {
      await mutateAsync({
        url: requestUrl.trim(),
        method: requestData.method,
        name: requestName.trim(),
      });
      toast.success(`Request saved to "${selectedCollection?.name}" collection`);
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to save request to collection");
      console.error(err);
    }
  };

  return (
    <Modal
      title="Save Request"
      description=""
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleSubmit}
      submitText={isPending ? "Saving..." : "Save"}
      submitVariant="default"
    >
      <div className="space-y-5">

        {/* Request Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Request Name</label>
          <div className="relative">
            <input
              value={requestName}
              onChange={e => setRequestName(e.target.value)}
              placeholder="Enter request name..."
              className="w-full p-3 pr-20 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded text-xs font-bold ${requestColorMap[requestData.method]} bg-gray-200 dark:bg-gray-700`}>
              {requestData.method}
            </span>
          </div>
        </div>

        {/* Request URL */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Request URL</label>
          <input
            value={requestUrl}
            onChange={e => setRequestUrl(e.target.value)}
            placeholder="Enter request URL..."
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Collection Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Select Collection</label>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>{selectedWorkspace?.name || "Workspace"}</span> › <span>Collections</span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search collections..."
              className="w-full pl-10 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Collection List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-4 text-gray-500 dark:text-gray-400">
                Loading collections...
              </div>
            ) : isError ? (
              <div className="text-red-500 py-4 text-center">Failed to load collections</div>
            ) : filteredCollections.length === 0 ? (
              <div className="text-gray-500 py-4 text-center">{searchTerm ? "No collections found" : "No collections available"}</div>
            ) : (
              filteredCollections.map(collection => (
                <div
                  key={collection.id}
                  onClick={() => setSelectedCollectionId(collection.id)}
                  className={`cursor-pointer rounded-lg p-2 flex items-center space-x-3 transition-all duration-200
                    ${selectedCollectionId === collection.id
                      ? "bg-indigo-600/20 border border-indigo-500 dark:border-indigo-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                    }`}
                >
                  <Folder className={`w-5 h-5 ${selectedCollectionId === collection.id ? "text-indigo-500" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className={`${selectedCollectionId === collection.id ? "text-indigo-700 dark:text-indigo-300 font-medium" : "text-gray-900 dark:text-gray-100"}`}>
                    {collection.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Collection Preview */}
        {selectedCollection && (
          <div className="p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">Saving to:</span>
            <Folder className="w-5 h-5 text-indigo-500" />
            <span className="text-indigo-700 dark:text-indigo-300 font-medium">{selectedCollection.name}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SaveRequestToCollectionModal;
