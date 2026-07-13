import pandas as pd
import numpy as np


def get_dia_pagamento_por_mes(df):
    """Retorna dict {Period('M'): dia_pagamento} baseado nos registros reais de salário."""
    pagamentos = df[(df['Local'] == 'CERN') & (df['Valor'] > 3000)].copy()
    if pagamentos.empty:
        return {}
    pagamentos['cal_month'] = pagamentos['Data'].dt.to_period('M')
    return pagamentos.groupby('cal_month')['Data'].first().dt.day.to_dict()


def get_periodo_pagamento_atual(df=None):
    hoje = pd.Timestamp.today().normalize()
    cal_mes_atual = hoje.to_period('M')

    dia_pag = 25  # fallback
    if df is not None:
        dia_por_mes = get_dia_pagamento_por_mes(df)
        if cal_mes_atual in dia_por_mes:
            dia_pag = dia_por_mes[cal_mes_atual]

    if hoje.day >= dia_pag:
        return (hoje + pd.DateOffset(months=1)).to_period('M')
    return cal_mes_atual

def add_categoria(df, df_param):
    df['Categoria'] = np.where(
        (df['Local'] == 'CERN') & (df['Valor'] > 3000),
        'Pagamento',
        df['Local'].map(
            df_param.set_index('Local')['Categoria']
        ).fillna('Extra')
    )
    return df

def add_categoria_geral(df, df_param):
    df['Categoria Geral'] = np.where(
        (df['Local'] == 'CERN') & (df['Valor'] > 3000),
        'Pagamento',
        df['Local'].map(
            df_param.set_index('Local')['Categoria Geral']
        ).fillna('Extra')
    )
    return df

def add_pagamento(df):
    df['Pagamento?'] = np.where(
        (df['Local'] == "CERN") & (df['Valor'] > 3000),
        "Sim",
        "Não"
    )
    return df

def add_mes_pagamento(df):
    dia_por_mes = get_dia_pagamento_por_mes(df)

    def _mes_pag(row):
        cal_mes = row['Data'].to_period('M')
        dia_pag = dia_por_mes.get(cal_mes, 25)
        if row['Data'].day >= dia_pag:
            return (row['Data'] + pd.DateOffset(months=1)).to_period('M')
        return cal_mes

    df['Mês Pagamento'] = df.apply(_mes_pag, axis=1)
    df['Ano Pagamento'] = df['Mês Pagamento'].dt.to_timestamp().dt.year

    return df

def add_saldo(df):
    saldo = []
    for i, row in df.iterrows():
        if i == 0:
            saldo_atual = 3486

        elif row['Pagamento?'] == 'Sim':
            saldo_atual = 3486

        else:
            saldo_atual = saldo[-1] - row['Valor']
        
        saldo.append(saldo_atual)

    df['Saldo'] = saldo
    return df

def add_mes_atual(df):
    periodo_pagamento_atual = get_periodo_pagamento_atual(df)
    df['Mês Pagamento Atual?'] = np.where(df['Mês Pagamento'] == periodo_pagamento_atual, 'Sim', 'Não')
    return df

def add_ano_atual(df):
    ano_atual = get_periodo_pagamento_atual(df).year
    df['Ano Pagamento Atual?'] = np.where(df['Ano Pagamento'] == ano_atual, 'Sim', 'Não')
    return df


def prepare_data(df, df_param):
    df['Data'] = pd.to_datetime(df['Data'], format='mixed')
    df['Data'].dt.strftime('%d/%m/%y')

    df = add_categoria(df, df_param)
    df = add_categoria_geral(df, df_param)
    df = add_pagamento(df)
    df = add_mes_pagamento(df)
    df = add_saldo(df)
    df = add_mes_atual(df)
    df = add_ano_atual(df)

    return df
