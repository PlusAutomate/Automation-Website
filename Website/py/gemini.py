# Instale as bibliotecas antes de rodar:
# pip install flask google-genai flask-cors

from flask import Flask, request, jsonify
from google import genai
from google.genai.errors import APIError
import os
import json

app = Flask(__name__)
from flask_cors import CORS 
CORS(app) 

# --- CONFIGURAÇÃO DA API KEY DO GEMINI ---
# CHAVE VIA https://aistudio.google.com/api-keys
client = genai.Client(api_key="AIzaSyAkcPfoz-zpTYZZ5csNpbKp3R_NPtKbeZQ")


# Função para gerar o Match Score usando o Gemini
def get_match_analysis(candidato_skills, vaga_requisitos, nome_vaga):
    """Envia dados para o modelo Gemini e extrai o score e a análise."""
    
    # Prepara o prompt (instrução) para o modelo Gemini
    # PROMPT OTIMIZADO: Lida com a possibilidade de análise para uma área, 
    # não uma vaga específica (Banco de Talentos)
    if not vaga_requisitos or vaga_requisitos.lower() == 'n/a':
        prompt_context = f"A análise é para o candidato se encaixar na área de **{nome_vaga}** (sem requisitos específicos de vaga). Fale sobre a aderência geral à área e seu potencial."
    else:
        prompt_context = f"A análise é para a vaga **{nome_vaga}** com os requisitos listados."
    
    prompt = f"""
    Você é um Analista de Recrutamento e Seleção de IA. Sua tarefa é comparar as HABILIDADES de um candidato com os REQUISITOS de uma vaga/área e fornecer um Match Score e uma breve Análise.
    
    {prompt_context}
    
    1.  **Match Score:** Calcule um percentual (0-100) de aderência. O score deve ser o primeiro item da sua resposta.
    2.  **Análise:** Escreva uma análise breve, em Português, justificando o score. Se for análise de Banco de Talentos, foque no potencial e nas áreas de maior aderência. Se for uma vaga, mencione os pontos fortes e os requisitos críticos faltantes.
    
    Formato de Saída OBRIGATÓRIO (apenas o JSON):
    {{
      "match_score": <número inteiro entre 0 e 100>,
      "analise_ia": "<texto da análise>",
      "modelo_usado": "gemini-2.5-flash"
    }}
    
    DADOS:
    Habilidades do Candidato: {candidato_skills}
    Requisitos da Vaga/Área (Se disponíveis): {vaga_requisitos}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json", 
            ),
        )
        
        return json.loads(response.text)

    except APIError as e:
        print(f"Erro da API do Gemini: {e}")
        return {"match_score": 0, "analise_ia": f"Erro ao contatar a IA (API Key?): {e}", "modelo_usado": "N/A"}
    except Exception as e:
        print(f"Erro inesperado: {e}")
        return {"match_score": 0, "analise_ia": f"Erro inesperado no servidor: {e}", "modelo_usado": "N/A"}


@app.route('/api/match-score', methods=['POST'])
def match_score_endpoint():
    """Endpoint da API chamado pelo JavaScript."""
    data = request.json
    
    candidato_skills = data.get('skills', [])
    vaga_requisitos = data.get('requisitos', "")
    nome_vaga = data.get('nomeVaga', "Área Geral") 
    
    if not candidato_skills:
        return jsonify({"match_score": 0, "analise_ia": "Erro: Habilidades do candidato não fornecidas."}), 400

    # Chama a função que usa o Gemini
    resultado = get_match_analysis(candidato_skills, vaga_requisitos, nome_vaga)
    
    return jsonify(resultado)

if __name__ == '__main__':
    app.run(debug=True, port=5000)