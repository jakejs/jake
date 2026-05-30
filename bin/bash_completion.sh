#!/bin/bash

# http://stackoverflow.com/a/12495480
# http://stackoverflow.com/a/28647824
_auto_jake()
{
    local cur
    local -a COMPGEN=()
    _get_comp_words_by_ref -n : -c cur
    
    local jake_bin="$(which jake)"

    if [ "$jake_bin" = "" ]; then
      return 0
    fi

    local jake_bin_dir="$(cd $(dirname "$jake_bin") && cd $(dirname $(readlink jake)) && pwd)"
    
    # run auto-completions in jake via our auto_complete.js wrapper
    local -a auto_complete_info=( $(export COMP_LINE="${COMP_LINE}" && ${jake_bin_dir}/auto_complete.js "$cur" "${3}") )
    # check reply flag
    local reply_flag="${auto_complete_info[0]}"
    if [[ "${reply_flag}" == "no-complete" ]]; then
        return 1
    fi
    local auto_completions=("${auto_complete_info[@]:1}")
    COMPGEN=( $(compgen -W "${auto_completions[*]}" -- "$cur") )
    COMPREPLY=( "${COMPGEN[@]}" )
    
    __ltrim_colon_completions "$cur"
    
    # do we need another space??
    if [[ "${reply_flag}" == "yes-space" ]]; then
        COMPREPLY=( "${COMPGEN[@]}" " " )
    fi
    
    return 0
} 

complete -o default -F _auto_jake jake
