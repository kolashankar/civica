import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Eye, Copy, MoveUp, MoveDown, X } from 'lucide-react';
import { templatesApi } from '../../services/api';
import type { Template, FormField } from '../../types';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [officeTypeFilter, setOfficeTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    office_types: [] as string[],
    form_fields: [] as FormField[],
  });

  const officeTypes = [
    { value: 'mro', label: 'MRO Office' },
    { value: 'municipality', label: 'Municipality' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'police', label: 'Police Station' },
    { value: 'other', label: 'Other' },
  ];

  const fieldTypes = [
    { value: 'rating', label: 'Rating (1-5 stars)' },
    { value: 'text', label: 'Text Input' },
    { value: 'multiline', label: 'Text Area' },
    { value: 'photo', label: 'Photo Upload' },
    { value: 'dropdown', label: 'Dropdown' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [page, search, officeTypeFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: (page - 1) * 10,
        limit: 10,
      };
      if (search) params.search = search;
      if (officeTypeFilter) params.office_type = officeTypeFilter;
      
      const response = await templatesApi.getAll(params);
      setTemplates(response.templates);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.office_types.length === 0) {
      alert('Please select at least one office type');
      return;
    }
    
    if (formData.form_fields.length === 0) {
      alert('Please add at least one form field');
      return;
    }
    
    // Validate dropdown fields have options
    for (const field of formData.form_fields) {
      if (field.field_type === 'dropdown' && (!field.options || field.options.length === 0)) {
        alert(`Dropdown field "${field.field_name}" must have at least one option`);
        return;
      }
    }
    
    try {
      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, formData);
      } else {
        await templatesApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this template?')) {
      try {
        await templatesApi.delete(id);
        fetchTemplates();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Error deleting template');
      }
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await templatesApi.activate(id);
      fetchTemplates();
    } catch (error) {
      console.error('Error activating template:', error);
    }
  };

  const handleClone = async (template: Template) => {
    const newName = prompt(`Enter name for cloned template:`, `${template.name} (Copy)`);
    if (newName) {
      try {
        await templatesApi.clone(template.id, newName);
        fetchTemplates();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Error cloning template');
      }
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingTemplate(null);
    setShowModal(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      office_types: template.office_types,
      form_fields: template.form_fields,
    });
    setShowModal(true);
  };

  const openPreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      office_types: [],
      form_fields: [],
    });
  };

  const addFormField = () => {
    setFormData({
      ...formData,
      form_fields: [
        ...formData.form_fields,
        {
          field_name: '',
          field_type: 'text' as any,
          is_required: true,
          options: [],
        },
      ],
    });
  };

  const updateFormField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...formData.form_fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, form_fields: newFields });
  };

  const removeFormField = (index: number) => {
    setFormData({
      ...formData,
      form_fields: formData.form_fields.filter((_, i) => i !== index),
    });
  };

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...formData.form_fields];
    [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
    setFormData({ ...formData, form_fields: newFields });
  };

  const moveFieldDown = (index: number) => {
    if (index === formData.form_fields.length - 1) return;
    const newFields = [...formData.form_fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    setFormData({ ...formData, form_fields: newFields });
  };

  const handleOfficeTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      office_types: prev.office_types.includes(type)
        ? prev.office_types.filter(t => t !== type)
        : [...prev.office_types, type],
    }));
  };

  const handleOptionAdd = (fieldIndex: number) => {
    const option = prompt('Enter option:');
    if (option) {
      const field = formData.form_fields[fieldIndex];
      updateFormField(fieldIndex, {
        options: [...(field.options || []), option],
      });
    }
  };

  const handleOptionRemove = (fieldIndex: number, optionIndex: number) => {
    const field = formData.form_fields[fieldIndex];
    updateFormField(fieldIndex, {
      options: field.options?.filter((_, i) => i !== optionIndex) || [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Manage inspection form templates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={officeTypeFilter}
            onChange={(e) => setOfficeTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Office Types</option>
            {officeTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No templates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Office Types</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fields</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {template.office_types.map(type => (
                          <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {officeTypes.find(t => t.value === type)?.label || type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{template.form_fields.length} fields</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{template.usage_count || 0} inspections</div>
                    </td>
                    <td className="px-6 py-4">
                      {template.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          <XCircle size={14} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPreview(template)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleClone(template)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Clone"
                        >
                          <Copy size={18} />
                        </button>
                        {template.is_active ? (
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Deactivate"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(template.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Activate"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 10 && (
          <div className="p-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} templates
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Office Types *</label>
                <div className="space-y-2">
                  {officeTypes.map(type => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.office_types.includes(type.value)}
                        onChange={() => handleOfficeTypeToggle(type.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Form Fields *</label>
                  <button
                    type="button"
                    onClick={addFormField}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>

                {formData.form_fields.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
                    No fields added yet. Click "Add Field" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.form_fields.map((field, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveFieldUp(index)}
                              disabled={index === 0}
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                              title="Move up"
                            >
                              <MoveUp size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveFieldDown(index)}
                              disabled={index === formData.form_fields.length - 1}
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                              title="Move down"
                            >
                              <MoveDown size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFormField(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Remove"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Field Name</label>
                            <input
                              type="text"
                              required
                              value={field.field_name}
                              onChange={(e) => updateFormField(index, { field_name: e.target.value })}
                              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Cleanliness Rating"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Field Type</label>
                            <select
                              value={field.field_type}
                              onChange={(e) => updateFormField(index, { field_type: e.target.value as any })}
                              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {fieldTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.is_required}
                              onChange={(e) => updateFormField(index, { is_required: e.target.checked })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-xs text-gray-600">Required field</span>
                          </label>
                        </div>

                        {field.field_type === 'dropdown' && (
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-xs font-medium text-gray-600">Options</label>
                              <button
                                type="button"
                                onClick={() => handleOptionAdd(index)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                + Add Option
                              </button>
                            </div>
                            <div className="space-y-1">
                              {field.options && field.options.length > 0 ? (
                                field.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2 bg-white p-2 rounded border">
                                    <span className="flex-1 text-sm">{option}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleOptionRemove(index, optIndex)}
                                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 italic">No options added yet</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Template Preview</h2>
              <p className="text-gray-600 mt-1">{previewTemplate.name}</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{previewTemplate.description}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Office Types</h3>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.office_types.map(type => (
                    <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {officeTypes.find(t => t.value === type)?.label || type}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-4">Form Fields ({previewTemplate.form_fields.length})</h3>
                <div className="space-y-4">
                  {previewTemplate.form_fields.map((field, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <label className="font-medium text-gray-800">
                          {field.field_name}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                          {fieldTypes.find(t => t.value === field.field_type)?.label}
                        </span>
                      </div>
                      {field.field_type === 'rating' && (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <div key={star} className="text-2xl text-gray-300">★</div>
                          ))}
                        </div>
                      )}
                      {field.field_type === 'text' && (
                        <input
                          type="text"
                          disabled
                          placeholder="Text input..."
                          className="w-full px-3 py-2 border rounded bg-white"
                        />
                      )}
                      {field.field_type === 'multiline' && (
                        <textarea
                          disabled
                          placeholder="Text area..."
                          rows={3}
                          className="w-full px-3 py-2 border rounded bg-white"
                        />
                      )}
                      {field.field_type === 'photo' && (
                        <div className="border-2 border-dashed rounded p-4 text-center text-gray-500">
                          Photo upload area
                        </div>
                      )}
                      {field.field_type === 'dropdown' && field.options && (
                        <select disabled className="w-full px-3 py-2 border rounded bg-white">
                          <option>Select an option...</option>
                          {field.options.map((opt, i) => (
                            <option key={i}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
